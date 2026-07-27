import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import * as XLSX from '@e965/xlsx';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { AppSymbolName } from '@/components/ui/icon-types';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import {
  clearMeasurements,
  getMeasurements,
  restoreBackup,
} from '@/data/database';

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

export default function SettingsScreen() {
  const db = useSQLiteContext();

  async function shareFile(kind: 'xlsx' | 'json') {
    try {
      const measurements = await getMeasurements(db, 10000);
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
        const sessions = await db.getAllAsync<{
          id: number;
          measured_at: string;
          wellbeing: number;
          tags_json: string;
          note: string;
          mode: string;
          created_at: string;
        }>(
          `SELECT id, measured_at, wellbeing, tags_json, note, mode, created_at
           FROM measurement_sessions
           ORDER BY measured_at DESC`,
        );
        const readings = await db.getAllAsync<{
          session_id: number;
          systolic: number;
          diastolic: number;
          pulse: number;
          position: number;
        }>(
          `SELECT r.session_id, r.systolic, r.diastolic, r.pulse, r.position
           FROM measurement_readings r
           JOIN measurement_sessions s ON s.id = r.session_id
           ORDER BY r.session_id, r.position`,
        );
        file.write(
          JSON.stringify(
            {
              app: 'Давление',
              version: 1,
              exportedAt: new Date().toISOString(),
              sessions: sessions.map((session) => ({
                ...session,
                tags: JSON.parse(session.tags_json) as string[],
                tags_json: undefined,
              })),
              readings,
            },
            null,
            2,
          ),
        );
      } else {
        const header = [
          'Дата и время',
          'Систолическое, мм рт. ст.',
          'Диастолическое, мм рт. ст.',
          'Пульс, уд/мин',
          'Самочувствие, из 10',
          'Отметки',
          'Заметка',
          'Количество замеров',
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
        ];
        worksheet['!autofilter'] = { ref: `A1:H${rows.length + 1}` };

        const workbook = XLSX.utils.book_new();
        workbook.Props = {
          Title: 'Дневник артериального давления',
          Subject: 'Экспорт измерений',
          Author: 'Давление',
        };
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Измерения');
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
                const count = await restoreBackup(db, payload);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Готово', `Восстановлено записей: ${count}.`);
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

      <Text style={styles.version}>Давление · версия 0.5.1</Text>
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
