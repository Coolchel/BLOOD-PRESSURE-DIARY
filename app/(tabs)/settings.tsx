'use no memo'; // Re-evaluate shared locale formatters when the language changes.

import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import { useSQLiteContext } from 'expo-sqlite';
import * as XLSX from '@e965/xlsx';
import { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { AppSymbolName } from '@/components/ui/icon-types';
import { Palette, Radius, Shadow, Spacing } from '@/constants/design';
import { measurementStats } from '@/constants/measurement-stats';
import {
  getLastAutoBackupAt,
  getBackupError,
  getBackupLocation,
  isAutoBackupEnabled,
  factoryResetDiary,
  changeBackupLocation,
  BackupDestinationExistsError,
  readStoredBackup,
  setAutoBackupEnabled,
  waitForBackupOperations,
} from '@/data/auto-backup';
import { backupFacts } from '@/data/backup-info';
import { openBackupDirectory, saveExcelFile } from '@/data/device-files';
import { BACKUP_FILENAME, defaultBackupLocation, hasBackupFile, pickBackupLocation, type BackupLocation } from '@/data/backup-storage';
import {
  buildBackupPayload,
  clearMeasurements,
  getMeasurements,
  getPhases,
  restoreBackup,
} from '@/data/database';
import { isInsidePhase, phaseKindInfo } from '@/types/experiment';
import { orderedLanguages } from '../../design-lab/i18n';
import { useLanguage } from '@/localization/provider';
import { tr, getLocale } from '@/localization';

type SettingsRowProps = {
  icon: AppSymbolName;
  title: string;
  subtitle: string;
  destructive?: boolean;
  onPress: () => void;
  disabled?: boolean;
  onLongPress?: () => void;
};

function SettingsRow({ icon, title, subtitle, destructive, onPress, disabled, onLongPress }: SettingsRowProps) {
  useLanguage();
  const color = destructive ? '#A96E70' : Palette.coral;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityHint={onLongPress ? tr('Нажмите, чтобы открыть папку. Удерживайте, чтобы изменить место сохранения.') : undefined}
      style={({ pressed }) => [styles.row, disabled && { opacity: 0.5 }, pressed && styles.rowPressed]}>
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
  disabled?: boolean;
};

function ToggleRow({ icon, title, subtitle, value, onValueChange, disabled }: ToggleRowProps) {
  useLanguage();
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
        disabled={disabled}
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
  const day = new Intl.DateTimeFormat(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  const time = new Intl.DateTimeFormat(getLocale(), { hour: '2-digit', minute: '2-digit' }).format(date);
  return day + tr(' в ') + time;
}

export default function SettingsScreen() {
  const { language, setLanguage, resetLanguage } = useLanguage();
  const [languageVisible, setLanguageVisible] = useState(false);
  const [languageBusy, setLanguageBusy] = useState(false);
  const [languageError, setLanguageError] = useState(false);
  const db = useSQLiteContext();
  const [autoBackup, setAutoBackup] = useState(true);
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [backupError, setBackupError] = useState('');
  const [backupBusy, setBackupBusy] = useState(false);
  const [hasCopy, setHasCopy] = useState(false);
  const [copyVisible, setCopyVisible] = useState(false);
  const [copyFacts, setCopyFacts] = useState<ReturnType<typeof backupFacts> | null>(null);

  const refreshAutoBackup = useCallback(async () => {
    try {
      await waitForBackupOperations();
      const [enabled, at, error] = await Promise.all([
        isAutoBackupEnabled(db), getLastAutoBackupAt(db), getBackupError(db),
      ]);
      setAutoBackup(enabled); setLastBackup(at);
      setBackupError(error || '');
      try { setHasCopy(await readStoredBackup(db) !== null); }
      catch { setHasCopy(false); setBackupError('Папка копии недоступна. Выберите её снова.'); }
    } catch {
      setBackupError('Папка копии недоступна. Выберите её снова.');
    }
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void refreshAutoBackup();
    }, [refreshAutoBackup]),
  );

  useEffect(() => {
    const listener = AppState.addEventListener('change', next => {
      if (next === 'active') void refreshAutoBackup();
    });
    return () => listener.remove();
  }, [refreshAutoBackup]);

  async function toggleAutoBackup(next: boolean) {
    try {
      await setAutoBackupEnabled(db, next);
      setAutoBackup(next);
      void Haptics.selectionAsync();
    } catch { Alert.alert(tr('Настройка не сохранена'), tr('Попробуйте переключить автоматическую копию ещё раз.')); }
  }

  async function openFolder() {
    setBackupBusy(true);
    try {
      await waitForBackupOperations();
      const folder = await getBackupLocation(db);
      await openBackupDirectory(await hasBackupFile(folder) ? folder : defaultBackupLocation());
    } catch (error) { Alert.alert(tr('Папка недоступна'), error instanceof Error ? tr(error.message) : tr('Не удалось открыть папку.')); }
    finally { setBackupBusy(false); }
  }

  async function moveCopy(location: BackupLocation, overwrite = false) {
    setBackupBusy(true);
    try { await changeBackupLocation(db, location, overwrite); await refreshAutoBackup(); }
    catch (error) {
      if (error instanceof BackupDestinationExistsError) {
        Alert.alert(tr('Заменить копию в этой папке?'), tr('В выбранной папке уже есть ') + BACKUP_FILENAME + '.', [
          { text: tr('Отмена'), style: 'cancel' }, { text: tr('Заменить'), onPress: () => void moveCopy(location, true) },
        ]);
      } else Alert.alert(tr('Папка не изменена'), error instanceof Error ? tr(error.message) : tr('Не удалось перенести копию.'));
    } finally { setBackupBusy(false); }
  }

  async function changeFolder() {
    setBackupBusy(true);
    try {
      await waitForBackupOperations();
      const picked = await pickBackupLocation(await getBackupLocation(db));
      if (picked) await moveCopy(picked);
    } catch (error) { Alert.alert(tr('Папка не изменена'), error instanceof Error ? tr(error.message) : tr('Не удалось выбрать папку.')); }
    finally { setBackupBusy(false); }
  }

  async function showCopy() {
    setBackupBusy(true);
    try {
      await waitForBackupOperations();
      const payload = await readStoredBackup(db);
      setCopyFacts(payload ? backupFacts(payload) : null);
      setCopyVisible(true);
    } catch (error) { Alert.alert(tr('Копия недоступна'), error instanceof Error ? tr(error.message) : tr('Не удалось прочитать копию.')); }
    finally { setBackupBusy(false); }
  }

  function confirmReset() {
    Alert.alert(tr('Сбросить дневник?'), tr('Все измерения, периоды, черновики и сохранённая резервная копия будут удалены. Настройки вернутся к исходным значениям. Это действие нельзя отменить.'), [
      { text: tr('Отмена'), style: 'cancel' },
      { text: tr('Сбросить всё'), style: 'destructive', onPress: async () => {
        setBackupBusy(true);
        try {
          await factoryResetDiary(db);
          resetLanguage();
          setCopyVisible(false); setCopyFacts(null);
          await refreshAutoBackup();
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch { Alert.alert(tr('Сброс не выполнен'), tr('Не удалось удалить данные или копию. Проверьте доступ к папке копии и повторите.')); }
        finally { setBackupBusy(false); }
      } },
    ]);
  }

  async function shareFile() {
    if (backupBusy) return;
    setBackupBusy(true);
    let temporaryFile: File | null = null;
    try {
      const measurements = await getMeasurements(db, -1);
      if (!measurements.length) {
        Alert.alert(tr('Нет данных для экспорта'), tr('Сначала сохрани хотя бы одно своё измерение.'));
        return;
      }

      const date = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `davlenie-export-${date}.xlsx`);
      temporaryFile = file;
      const phases = await getPhases(db);
      const header = [
        tr('Дата и время'),
        tr('Систолическое, мм рт. ст.'),
        tr('Диастолическое, мм рт. ст.'),
        tr('Пульс, уд/мин'),
        tr('Самочувствие, из 10'),
        tr('Отметки'),
        tr('Заметка'),
        tr('Количество замеров'),
        tr('Период эксперимента'),
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
        Title: tr('Дневник артериального давления'),
        Subject: tr('Экспорт измерений'),
        Author: tr('Давление'),
      };
      XLSX.utils.book_append_sheet(workbook, worksheet, tr('Измерения'));

      const payload = await buildBackupPayload(db);
      const sessionDates = new Map(payload.sessions.map((session) => [session.id, session.measured_at]));
      const readingSheet = XLSX.utils.aoa_to_sheet([
        [tr('Запись'), tr('Номер замера'), tr('Дата и время'), tr('Систолическое, мм рт. ст.'), tr('Диастолическое, мм рт. ст.'), tr('Пульс, уд/мин')],
        ...payload.readings.map((reading) => [
          reading.session_id,
          reading.position + 1,
          new Date(reading.measured_at ?? sessionDates.get(reading.session_id)!),
          reading.systolic, reading.diastolic, reading.pulse,
        ]),
      ], { cellDates: true });
      for (let row = 2; row <= payload.readings.length + 1; row += 1) {
        readingSheet[`C${row}`].z = 'dd.mm.yyyy hh:mm';
      }
      readingSheet['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 27 }, { wch: 29 }, { wch: 17 }];
      readingSheet['!autofilter'] = { ref: `A1:F${payload.readings.length + 1}` };
      XLSX.utils.book_append_sheet(workbook, readingSheet, tr('Замеры'));

      if (phases.length) {
        const phaseHeader = [
          tr('Период'),
          tr('Что употреблялось'),
          tr('Начало'),
          tr('Окончание'),
          tr('Записей'),
          tr('Систолическое'),
          tr('Диастолическое'),
          tr('Пульс'),
          tr('Самочувствие'),
          tr('Заметка'),
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
            phase.endedAt ? new Date(phase.endedAt) : tr('продолжается'),
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
        XLSX.utils.book_append_sheet(workbook, phaseSheet, tr('Периоды'));
      }
      const base64 = XLSX.write(workbook, {
        bookType: 'xlsx',
        type: 'base64',
        compression: true,
      }) as string;
      await LegacyFileSystem.writeAsStringAsync(file.uri, base64, {
        encoding: LegacyFileSystem.EncodingType.Base64,
      });

      if (await saveExcelFile(file.uri, file.name)) void Haptics.selectionAsync();
    } catch (error) {
      const reason = error instanceof Error ? tr(error.message) : tr('неизвестная ошибка');
      console.error(tr('Не удалось экспортировать файл:'), error);
      Alert.alert(
        tr('Не получилось создать файл'),
        tr`Причина: ${reason}\n\nСообщи этот текст, если ошибка повторится.`,
      );
    } finally {
      try { if (temporaryFile?.exists) temporaryFile.delete(); } catch { /* A later reset also clears app-owned export files. */ }
      setBackupBusy(false);
    }
  }

  function confirmClear() {
    Alert.alert(
      tr('Удалить все измерения?'),
      tr('Это действие нельзя отменить. Проверьте сохранённую резервную копию перед удалением.'),
      [
        { text: tr('Отмена'), style: 'cancel' },
        {
          text: tr('Удалить'),
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
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: 'application/json' });
      if (result.canceled) return;
      const payload = JSON.parse(await new File(result.assets[0].uri).text()) as unknown;

      Alert.alert(
        tr('Восстановить резервную копию?'),
        tr('Текущие записи будут заменены данными из выбранного файла.'),
        [
          { text: tr('Отмена'), style: 'cancel' },
          {
            text: tr('Восстановить'),
            onPress: async () => {
              try {
                const restored = await restoreBackup(db, payload);
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  tr('Готово'),
                  restored.phases === null
                    ? tr`Восстановлено записей: ${restored.sessions}. Периоды в этой копии не сохранены — текущие оставлены как есть.`
                    : tr`Восстановлено записей: ${restored.sessions}, периодов: ${restored.phases}.`,
                );
              } catch {
                Alert.alert(tr('Файл не подходит'), tr('Выбери резервную копию, созданную приложением.'));
              }
            },
          },
        ],
      );
    } catch {
      Alert.alert(tr('Файл не подходит'), tr('Не удалось прочитать выбранную резервную копию.'));
    }
  }


  return (
    <ScreenShell>
      <Text style={styles.eyebrow}>{tr("ДАННЫЕ И ПРИЛОЖЕНИЕ")}</Text>
      <Text style={styles.title}>{tr("Настройки")}</Text>
      <Text style={styles.subtitle}>{tr("Все данные хранятся только на этом устройстве")}</Text>

      <Text style={styles.sectionTitle}>{tr('Интерфейс')}</Text>
      <View style={styles.group}>
        <SettingsRow icon="globe" title={tr('Язык приложения')}
          subtitle={orderedLanguages(language)[0].name}
          onPress={() => { setLanguageError(false); setLanguageVisible(true); }} />
      </View>

      <Text style={styles.sectionTitle}>{tr("Резервная копия")}</Text>
      <View style={styles.group}>
        <ToggleRow
          disabled={backupBusy}
          icon="arrow.counterclockwise"
          onValueChange={(next) => void toggleAutoBackup(next)}
          subtitle={tr("При запуске 1 раз в 24 часа")}
          title={tr("Автоматическая копия")}
          value={autoBackup}
        />
        <View style={styles.divider} />
        <SettingsRow icon="folder" title={tr("Папка сохранения")} subtitle={tr("В хранилище")}
          disabled={backupBusy} onPress={() => void openFolder()} onLongPress={() => void changeFolder()} />
        <View style={styles.divider} />
        <SettingsRow icon="doc" title={tr("Сохранённая копия")} disabled={backupBusy}
          subtitle={hasCopy && lastBackup ? tr('Обновлено: ') + formatBackupMoment(lastBackup) : autoBackup ? tr('После первого измерения и следующего открытия') : tr('Автоматическая копия выключена')}
          onPress={() => void showCopy()} />
        <View style={styles.autoInfo}>
          <Text style={styles.autoInfoText}>
            {tr(backupError) || (!autoBackup ? tr('Автоматическое копирование выключено') : tr('Один JSON-файл. Повторные открытия в течение 24 часов его не обновляют.'))}
          </Text>
          <Text style={styles.autoInfoHint}>
            {BACKUP_FILENAME}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>{tr("Экспорт и восстановление")}</Text>
      <View style={styles.group}>
        <SettingsRow
          icon="square.and.arrow.up"
          onPress={() => void shareFile()}
          disabled={backupBusy}
          subtitle={tr("Готовая таблица .xlsx для Excel, Numbers или врача")}
          title={tr("Экспортировать Excel")}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon="square.and.arrow.down"
          onPress={() => void chooseBackup()}
          disabled={backupBusy}
          subtitle={tr("Выбрать JSON-файл на устройстве")}
          title={tr("Импортировать копию")}
        />
      </View>

      <Text style={styles.sectionTitle}>{tr("Сброс")}</Text>
      <View style={styles.group}>
        <SettingsRow
          destructive
          icon="trash"
          onPress={confirmClear}
          disabled={backupBusy}
          subtitle={tr("Периоды и резервная копия останутся")}
          title={tr("Удалить все измерения")}
        />
        <View style={styles.divider} />
        <SettingsRow destructive icon="arrow.counterclockwise" disabled={backupBusy}
          onPress={confirmReset} title={tr("Сброс к заводским настройкам")}
          subtitle={tr("Удаление всей информации в приложении")} />
      </View>

      <View style={styles.privacy}>
        <Text style={styles.privacyTitle}>{tr("Приватность по умолчанию")}</Text>
        <Text style={styles.privacyText}>{tr(" В этой версии нет аккаунта, облака или интеграций. Измерения не покидают телефон, пока ты сам не экспортируешь файл. ")}</Text>
      </View>

      <Text style={styles.version}>{tr("Давление · версия 0.7.1")}</Text>
      <Modal visible={languageVisible} transparent animationType="fade"
        onRequestClose={() => { if (!languageBusy) setLanguageVisible(false); }}>
        <View style={styles.copyBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={tr('Закрыть')}
            disabled={languageBusy} onPress={() => setLanguageVisible(false)} />
          <View style={styles.copySheet} accessibilityViewIsModal>
            <Text style={styles.copyTitle}>{tr('Язык приложения')}</Text>
            {orderedLanguages(language).map(option => <Pressable key={option.code}
              accessibilityRole="radio" accessibilityState={{ checked: option.code === language, disabled: languageBusy }}
              disabled={languageBusy} style={styles.languageRow} onPress={async () => {
                setLanguageBusy(true); setLanguageError(false);
                try { await setLanguage(option.code); setLanguageVisible(false); void Haptics.selectionAsync(); }
                catch { setLanguageError(true); }
                finally { setLanguageBusy(false); }
              }}>
              <Text style={styles.languageCode}>{option.code.toUpperCase()}</Text>
              <Text style={styles.rowTitle}>{option.name}</Text>
              {option.code === language ? <IconSymbol name="checkmark" size={20} color={Palette.coral} /> : null}
            </Pressable>)}
            {languageError ? <Text accessibilityLiveRegion="polite" style={styles.rowSubtitle}>{tr('Не удалось сохранить язык. Попробуйте ещё раз.')}</Text> : null}
            <Pressable disabled={languageBusy} style={styles.copyClose} onPress={() => setLanguageVisible(false)}>
              <Text style={styles.copyCloseText}>{tr('Закрыть')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={copyVisible} transparent animationType="fade" onRequestClose={() => setCopyVisible(false)}>
        <View style={styles.copyBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel={tr("Закрыть резервную копию")} onPress={() => setCopyVisible(false)} />
          <View style={styles.copySheet} accessibilityViewIsModal>
            <Text style={styles.copyTitle}>{tr("Резервная копия")}</Text>
            <ScrollView>
              {copyFacts ? <>
                <View style={styles.copyFile}><IconSymbol name="doc" size={32} color={Palette.coral} />
                  <Text style={styles.copyFilename}>{BACKUP_FILENAME}</Text><Text style={styles.rowSubtitle}>JSON</Text></View>
                {([
                  [tr('Обновлено'), formatBackupMoment(copyFacts.at)], [tr('Записей'), copyFacts.records],
                  [tr('Исходных замеров'), copyFacts.readings], [tr('Серий'), copyFacts.series],
                  [tr('Дней с измерениями'), copyFacts.days], [tr('Периодов'), copyFacts.periods],
                ] as const).map(([label, value]) => <View key={label} style={styles.copyFact}>
                  <Text style={styles.copyLabel}>{label}</Text><Text style={styles.copyValue}>{value}</Text>
                </View>)}
              </> : <Text style={styles.copyEmpty}>{tr("Копии пока нет. Она появится при открытии приложения с сохранёнными измерениями и включённой автоматической копией.")}</Text>}
            </ScrollView>
            <Pressable style={styles.copyClose} onPress={() => setCopyVisible(false)}>
              <Text style={styles.copyCloseText}>{tr("Закрыть")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  languageRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Palette.line },
  languageCode: { color: Palette.coral, fontSize: 12, width: 36 },
  copyBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24,32,47,0.35)' },
  copySheet: { maxHeight: '85%', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: Palette.white, padding: 24, paddingBottom: 36 },
  copyTitle: { color: Palette.text, fontSize: 23, fontWeight: '600', marginBottom: 12 },
  copyFile: { alignItems: 'center', gap: 10, paddingVertical: 20 },
  copyFilename: { color: Palette.text, fontSize: 15 },
  copyFact: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, borderTopWidth: StyleSheet.hairlineWidth, borderColor: Palette.line, paddingVertical: 13 },
  copyLabel: { color: Palette.muted, fontSize: 13 },
  copyValue: { color: Palette.text, fontSize: 13, textAlign: 'right', flexShrink: 1 },
  copyEmpty: { color: Palette.muted, fontSize: 14, lineHeight: 21, paddingVertical: 24 },
  copyClose: { backgroundColor: Palette.coral, borderRadius: Radius.pill, alignItems: 'center', padding: 15, marginTop: 20 },
  copyCloseText: { color: Palette.white, fontSize: 15, fontWeight: '600' },
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
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  rowPressed: {
    backgroundColor: 'rgba(255,94,87,0.05)',
  },
  toggleRow: {
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingLeft: Spacing.md,
    // Справа запас больше: у iOS-переключателя тень выходит за границы вёрстки.
    paddingRight: 18,
    paddingVertical: 12,
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
