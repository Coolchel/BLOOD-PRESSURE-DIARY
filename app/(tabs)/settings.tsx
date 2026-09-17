import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import * as XLSX from '@e965/xlsx';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { AppSymbolName } from '@/components/ui/icon-types';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { measurementStats } from '@/constants/measurement-stats';
import {
  getLastAutoBackupAt,
  isAutoBackupEnabled,
  runAutoBackup,
  setAutoBackupEnabled,
} from '@/data/auto-backup';
import {
  buildBackupPayload,
  clearMeasurements,
  getMeasurements,
  getPhases,
  restoreBackup,
} from '@/data/database';
import { isInsidePhase, phaseKindInfo } from '@/types/experiment';

type SettingsRowProps = {
  icon: AppSymbolName;
  title: string;
  subtitle: string;
  destructive?: boolean;
  onPress: () => void;
};

function SettingsRow({ icon, title, subtitle, destructive, onPress }: SettingsRowProps) {
  const color = destructive ? '#D93D43' : Palette.coral;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? '#FFF0F1' : Palette.coralSoft }]}>
        <IconSymbol name={icon} size={21} color={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, destructive && { color }]}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <IconSymbol name="chevron.right" size={18} color={Palette.subtle} />
    </Pressable>
  );
}

type ToggleRowProps = {
  icon: AppSymbolName;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

function ToggleRow({ icon, title, subtitle, value, onValueChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={[styles.rowIcon, { backgroundColor: Palette.coralSoft }]}>
        <IconSymbol name={icon} size={21} color={Palette.coral} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        ios_backgroundColor="#E4E6EA"
        onValueChange={onValueChange}
        thumbColor={Palette.white}
        trackColor={{ false: '#E4E6EA', true: Palette.coral }}
        value={value}
      />
    </View>
  );
}

function formatBackupMoment(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const [autoBackup, setAutoBackup] = useState(true);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);

  const refreshAutoBackup = useCallback(async () => {
    setAutoBackup(await isAutoBackupEnabled(db));
    setLastBackup(await getLastAutoBackupAt(db));
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refreshAutoBackup();
    }, [refreshAutoBackup]),
  );

  async function toggleAutoBackup(next: boolean) {
    setAutoBackup(next);
    await setAutoBackupEnabled(db, next);
    void Haptics.selectionAsync();

    if (next && (await runAutoBackup(db)) === 'written') {
      setLastBackup(new Date());
    }
  }

  async function shareFile(kind: 'xlsx' | 'json') {
    try {
      const measurements = await getMeasurements(db, -1);
      if (!measurements.length) {
        Alert.alert('Нет данных для экспорта', 'Сначала сохрани хотя бы одно своё измерение.');
        return;
      }

      const date = new Date().toISOString().slice(0, 10);
      const file =
        kind === 'json'
          ? new File(Paths.cache, `davlenie-backup-${date}.json`)
          : new File(Paths.cache, `davlenie-export-${date}.xlsx`);

      if (kind === 'json') {
        file.write(JSON.stringify(await buildBackupPayload(db), null, 2));
      } else {
        const phases = await getPhases(db);
        const header = [
          'Дата и время',
          'Систолическое, мм рт. ст.',
          'Диастолическое, мм рт. ст.',
          'Пульс, уд/мин',
          'Самочувствие, из 10',
          'Отметки',
          'Заметка',
          'Количество замеров',
          'Период эксперимента',
        ];
        const rows = measurements.map((item) => [
          new Date(item.measuredAt),
          item.systolic,
          item.diastolic,
          item.pulse,
          item.wellbeing,
          item.tags.join('; '),
          item.note,
          item.readingCount,
          phases.find((phase) => isInsidePhase(item.measuredAt, phase))?.title ?? '',
        ]);
        const worksheet = XLSX.utils.aoa_to_sheet([header, ...rows], { cellDates: true });
        worksheet.A2.z = 'dd.mm.yyyy hh:mm';
        for (let row = 3; row <= rows.length + 1; row += 1) {
          worksheet[`A${row}`].z = 'dd.mm.yyyy hh:mm';
        }
        worksheet['!cols'] = [
          { wch: 20 },
          { wch: 27 },
          { wch: 29 },
          { wch: 17 },
          { wch: 22 },
          { wch: 28 },
          { wch: 40 },
          { wch: 22 },
          { wch: 24 },
        ];
        worksheet['!autofilter'] = { ref: `A1:I${rows.length + 1}` };

        const workbook = XLSX.utils.book_new();
        workbook.Props = {
          Title: 'Дневник артериального давления',
          Subject: 'Экспорт измерений',
          Author: 'Давление',
        };
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Измерения');

        if (phases.length) {
          const phaseHeader = [
            'Период',
            'Что употреблялось',
            'Начало',
            'Окончание',
            'Записей',
            'Систолическое',
            'Диастолическое',
            'Пульс',
            'Самочувствие',
            'Заметка',
          ];
          const phaseRows = phases.map((phase) => {
            const inside = measurements.filter((item) =>
              isInsidePhase(item.measuredAt, phase),
            );
            const stats = measurementStats(inside);

            return [
              phase.title,
              phaseKindInfo(phase.kind).label,
              new Date(phase.startedAt),
              phase.endedAt ? new Date(phase.endedAt) : 'продолжается',
              inside.length,
              inside.length ? stats.systolic : '',
              inside.length ? stats.diastolic : '',
              inside.length ? stats.pulse : '',
              inside.length ? stats.wellbeing : '',
              phase.note,
            ];
          });

          const phaseSheet = XLSX.utils.aoa_to_sheet([phaseHeader, ...phaseRows], {
            cellDates: true,
          });
          for (let row = 2; row <= phaseRows.length + 1; row += 1) {
            for (const column of ['C', 'D']) {
              const cell = phaseSheet[`${column}${row}`];
              if (cell && cell.t === 'd') cell.z = 'dd.mm.yyyy hh:mm';
            }
          }
          phaseSheet['!cols'] = [
            { wch: 24 },
            { wch: 20 },
            { wch: 20 },
            { wch: 20 },
            { wch: 10 },
            { wch: 16 },
            { wch: 16 },
            { wch: 10 },
            { wch: 15 },
            { wch: 40 },
          ];
          XLSX.utils.book_append_sheet(workbook, phaseSheet, 'Периоды');
        }
        const base64 = XLSX.write(workbook, {
          bookType: 'xlsx',
          type: 'base64',
          compression: true,
        }) as string;
        await LegacyFileSystem.writeAsStringAsync(file.uri, base64, {
          encoding: LegacyFileSystem.EncodingType.Base64,
        });
      }

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Экспорт недоступен', `Файл создан: ${file.uri}`);
        return;
      }

      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Sharing.shareAsync(file.uri, {
        dialogTitle: kind === 'json' ? 'Резервная копия' : 'Таблица измерений',
        mimeType:
          kind === 'json'
            ? 'application/json'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        UTI:
          kind === 'json'
            ? 'public.json'
            : 'org.openxmlformats.spreadsheetml.sheet',
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'неизвестная ошибка';
      console.error('Не удалось экспортировать файл:', error);
      Alert.alert(
        'Не получилось создать файл',
        `Причина: ${reason}\n\nСообщи этот текст, если ошибка повторится.`,
      );
    }
  }

  function confirmClear() {
    Alert.alert(
      'Удалить все измерения?',
      'Это действие нельзя отменить. Сначала можно создать резервную копию.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            await clearMeasurements(db);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ],
    );
  }

  async function chooseBackup() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        type: 'application/json',
      });
      if (result.canceled) return;

      const file = new File(result.assets[0].uri);
      const payload = JSON.parse(await file.text()) as unknown;

      Alert.alert(
        'Восстановить резервную копию?',
        'Текущие записи будут заменены данными из выбранного файла.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Восстановить',
            onPress: async () => {
              try {
                const restored = await restoreBackup(db, payload);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                void runAutoBackup(db);
                Alert.alert(
                  'Готово',
                  restored.phases === null
                    ? `Восстановлено записей: ${restored.sessions}. Периоды в этой копии не сохранены — текущие оставлены как есть.`
                    : `Восстановлено записей: ${restored.sessions}, периодов: ${restored.phases}.`,
                );
              } catch {
                Alert.alert('Файл не подходит', 'Выбери резервную копию, созданную приложением.');
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert('Файл не подходит', 'Не удалось прочитать выбранную резервную копию.');
    }
  }

  return (
    <ScreenShell>
      <Text style={styles.eyebrow}>ДАННЫЕ И ПРИЛОЖЕНИЕ</Text>
      <Text style={styles.title}>Настройки</Text>
      <Text style={styles.subtitle}>Все данные хранятся только на этом устройстве</Text>

      <Text style={styles.sectionTitle}>Автоматическая копия</Text>
      <View style={styles.group}>
        <ToggleRow
          icon="arrow.counterclockwise"
          onValueChange={(next) => void toggleAutoBackup(next)}
          subtitle="Сохранять JSON в «Файлы» после каждого измерения"
          title="Копия без напоминаний"
          value={autoBackup}
        />
        <View style={styles.divider} />
        <View style={styles.autoInfo}>
          <Text style={styles.autoInfoText}>
            {!autoBackup
              ? 'Копии не создаются — данные останутся только внутри приложения'
              : lastBackup
                ? `Последняя копия: ${formatBackupMoment(lastBackup)}`
                : 'Копия появится сразу после первого измерения'}
          </Text>
          <Text style={styles.autoInfoHint}>
            Файлы → На iPhone → Давление. Хранятся текущая копия и семь последних дневных.
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Экспорт и копия</Text>
      <View style={styles.group}>
        <SettingsRow
          icon="square.and.arrow.up"
          onPress={() => void shareFile('xlsx')}
          subtitle="Готовая таблица .xlsx для Excel, Numbers или врача"
          title="Экспортировать Excel"
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="arrow.counterclockwise"
          onPress={() => void shareFile('json')}
          subtitle="Полная копия записей в формате JSON"
          title="Создать резервную копию"
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="square.and.arrow.down"
          onPress={() => void chooseBackup()}
          subtitle="Заменить текущие записи данными из JSON"
          title="Восстановить из копии"
        />
      </View>

      <Text style={styles.sectionTitle}>Данные</Text>
      <View style={styles.group}>
        <SettingsRow
          destructive
          icon="trash"
          onPress={confirmClear}
          subtitle="Полностью очистить локальную базу"
          title="Удалить все измерения"
        />
      </View>

      <View style={styles.privacy}>
        <Text style={styles.privacyTitle}>Приватность по умолчанию</Text>
        <Text style={styles.privacyText}>
          В этой версии нет аккаунта, облака или интеграций. Измерения не покидают телефон, пока
          ты сам не экспортируешь файл.
        </Text>
      </View>

      <Text style={styles.version}>Давление · версия 0.7.1</Text>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: Palette.coral,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  title: {
    color: Palette.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.1,
    marginTop: 2,
  },
  subtitle: {
    color: Palette.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  sectionTitle: {
    color: Palette.text,
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginTop: Spacing.xl,
    marginBottom: 12,
  },
  group: {
    overflow: 'hidden',
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.large,
    backgroundColor: Palette.surfaceStrong,
    ...Shadow.card,
  },
  row: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: Spacing.md,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,94,87,0.05)',
  },
  toggleRow: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingLeft: Spacing.md,
    // Справа запас больше: у iOS-переключателя тень выходит за границы вёрстки.
    paddingRight: 18,
    paddingVertical: 16,
  },
  rowIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    color: Palette.text,
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
    backgroundColor: Palette.line,
  },
  autoInfo: {
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  autoInfoText: {
    color: Palette.text,
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
  },
  autoInfoHint: {
    color: Palette.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  privacy: {
    padding: Spacing.md,
    marginTop: Spacing.xl,
    borderRadius: Radius.medium,
    backgroundColor: Palette.coralSoft,
  },
  privacyTitle: {
    color: Palette.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  privacyText: {
    color: Palette.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  version: {
    color: Palette.subtle,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
