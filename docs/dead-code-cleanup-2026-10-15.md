# Удаление мёртвого кода — 15 октября 2026

После переноса «Ясно» на нативные экраны в репозитории остались экраны, хуки и данные прежнего оформления «Coral Glass», старый путь чтения SQLite и неиспользуемые пакеты. В приложение они не входили: маршруты `app/` показывают только `components/clarity`, а экраны читают дневник через `readClarityState` и общую модель `design-lab/model.js`. Удаление не меняет поведение; состав JavaScript-пакета сверен до и после изменений.

## Как найден мёртвый код

Построен граф импортов от всех маршрутов `app/` и локального модуля `modules/diary-backup` с учётом алиаса `@/`, платформенных файлов `.ios` / `.web`, `require()` и `import type`. Отдельно построен граф от тестов: так видны файлы, которые жили только ради проверок. Затем TypeScript Language Service нашёл экспорты живых файлов без внешних ссылок. Повторный прогон после удаления не находит ни недостижимых файлов, ни неиспользуемых экспортов.

## Удалено

- **48 файлов.** Компоненты прежнего оформления (19): `coral-background`, `data-load-state`, `external-link`, `glass-card`, `haptic-tab`, `hello-wave`, `history-filters`, `measurement-card`, `measurement-entry`, `metric-row`, `number-entry-sheet`, `parallax-scroll-view`, `screen-shell`, `themed-text`, `themed-view`, `ui/collapsible`, `ui/icon-symbol`, `ui/icon-symbol.ios`, `weekly-chart`. Константы (7): `chart-data`, `history-filters`, `measurement-entry`, `phase-format`, `statistics-data`, `theme`, `measurement-stats`. Папка `hooks/` целиком (5 файлов), `data/phase-actions.ts`, шаблонный `scripts/reset-project.js` вместе с командой `npm run reset-project`, тест старых хуков `scripts/load-state.test.cjs`. Ресурсы: 12 шаблонных PNG Expo и прежних иконок coral, 2 SVG-исходника coral; иконки «Ясно» создаёт `scripts/clarity-icons.ps1`.
- **Старое чтение SQLite в `data/database.ts`:** `getMeasurements` с сортировкой и диапазоном дат, `getMeasurementById`, `getPhaseById`, `getPhasesWithStats`, `getMeasurementsInPhase` и их внутренние функции. `countMeasurements` больше не принимает фильтр, который никто не передавал. Из `types/` удалены типы и данные этого пути: `MeasurementSort`, `MeasurementQuery`, `MeasurementSummary`, `MeasurementDetails`, `WELLBEING_TAGS`, `PhaseStats`, `PhaseWithStats`, `PHASE_KINDS`, `phaseKindInfo`, `findPhaseFor`.
- **Экспорты без пользователей:** `Shadow` и цвет `Palette.shadow`, `saveExcelFile`, `formatNumber`.
- **Шесть зависимостей:** `@expo/vector-icons`, `@react-native-community/datetimepicker`, `expo-blur`, `expo-image`, `expo-linear-gradient`, `expo-web-browser`. Ни один модуль этих пакетов не входил в JavaScript-пакеты iOS и web, и никакой другой пакет от них не зависит.

## Оставлено намеренно

- `react-native-gesture-handler` и `expo-symbols`: в JavaScript-пакет не входят, но нужны `expo-router` (peer-зависимость и прямая зависимость соответственно); npm установил бы их снова.
- Нативный метод `saveExcelAsync` в `DiaryBackupModule` (Swift / Kotlin) и его тип в `modules/diary-backup/index.ts`. Из JavaScript он больше не вызывается, но изменение нативного кода нельзя проверить сборкой на Windows.
- Неиспользуемые значения шкалы оформления в `constants/design.ts` (`Palette.orangeSoft`, `Palette.success`, `Radius.small`, часть `Spacing`).

## Тесты

Удалены 17 тестов, которые проверяли только удалённый код: пять тестов старых хуков и двенадцать тестов SQL-истории (порции, сортировки, фильтр дат), SQL-сводок периодов, старого преобразования формы ввода, интервальной статистики и графика `WeeklyChart`. Действующие сортировки истории, фильтры и неокруглённые средние проверяются в `design-lab/tests/model.test.cjs`.

Тесты миграций, восстановления копий, периодов и автокопии сохранены и переписаны. Записи они читают через `readClarityState`, как экраны, а время исходных замеров и дату записи — прямо из строк SQLite, чтобы значения по умолчанию модели не скрывали отсутствующее поле базы. Вызовы `savePhase` / `removePhase` заменены функциями `createPhase`, `updatePhase` и `deletePhase`, которые они вызывали. В тесте переводов список нативных файлов с русскими строками теперь состоит только из `components/clarity`.

## Проверки

- `npm test` — 109 тестов (126 до удаления минус 17), `npm run test:design` — 90, `npm run typecheck`, `npm run lint`, `tsc --noEmit --noUnusedLocals --noUnusedParameters` без замечаний.
- Состав пакетов сверен по source maps `expo export`: iOS — 1699 → 1698 исходных модулей, web — 1297 → 1296. Единственное отличие — `constants/measurement-stats.ts`, который использовался только удалённым чтением SQLite. Счётчик модулей в выводе Metro меняется от запуска к запуску при одинаковом составе (web — от 1264 до 1303), поэтому сравнивались списки, а не счётчик. Android-пакет собирается; его состав по source maps отдельно не сравнивался.
- Автолинковка после удаления содержит все вызываемые модули: `diary-backup`, `expo-sqlite`, `expo-file-system`, `expo-sharing`, `expo-document-picker`, `expo-haptics`, `expo-localization`, `expo-font`, `expo-system-ui`, `expo-splash-screen`, slider, svg, reanimated, worklets, screens, safe-area-context.
- Expo Doctor: 20 из 21. Единственное замечание — патч-версии `expo`, `expo-router`, `expo-constants`, `expo-linking`, `expo-sharing`, `expo-splash-screen`, вышедшие после 11 октября; к удалению не относится, обновление не выполнялось.

## Установочная сборка 0.8.4 (9)

EAS Ad Hoc сборка iOS `5a972c86-aa71-49b7-a8d4-a932aedbb60f` завершена успешно: [страница установки](https://expo.dev/accounts/coolchel/projects/blood-pressure-diary/builds/5a972c86-aa71-49b7-a8d4-a932aedbb60f). Версия и номер сборки обновлены в `app.json`, `package.json` и `package-lock.json`; Bundle ID, профиль и сертификат прежние.

В `eas.json` не задан `requireCommit`, поэтому EAS копирует рабочую папку: 126 файлов, без удалённых файлов и файлов подписи. Метаданные EAS указывают базовый коммит `b921cb8`, но архив содержал незакоммиченные изменения этого этапа; это подтверждает содержимое встроенного JavaScript.

Скачанный IPA сравнён с 0.8.3 (8): имя «Давление», 0.8.4 (9), прежний Bundle ID, iOS 16.4+, пять локалей. `embedded.mobileprovision` побайтово совпадает с `ios/certs/profile.mobileprovision` и профилем 0.8.3 (8), подпись содержит прежний сертификат. Модули `DiaryBackupModule`, SQLite, файлов, отправки, выбора документа, тактильности, локализации, slider, svg и reanimated на месте; исчезли blur, image, linear-gradient, web-browser, datetimepicker и фреймворки `ExpoImage`, `SDWebImage` с декодерами AVIF / SVG / WebP, `libavif`. В `main.jsbundle` нет `getPhasesWithStats`, `getMeasurementsInPhase`, `getMeasurementById`, `saveExcelFile` и `formatNumber`; `readClarityState`, `restoreBackup`, Manrope и `DiaryBackup` присутствуют. IPA — 11,6 МБ вместо 13,9 МБ, 124 файла приложения вместо 154. SHA-256 IPA: `c0544aab01992ee0f49b6024797c99a23369766b682228e10b1a24eccdea709e`.

15 октября пользователь одобрил сборку и попросил зафиксировать изменения.

## Туннель Expo на Windows

Expo CLI ищет глобально установленный `@expo/ngrok` в `%LOCALAPPDATA%\npm` и `<prefix>\lib`, а npm на Windows устанавливает глобальные пакеты в `%APPDATA%\npm\node_modules`. Поэтому `npx expo start --tunnel` не находит уже установленный пакет и запрашивает его установку; без интерактивного ввода запуск завершается ошибкой. Рабочий запуск из PowerShell:

```powershell
$env:NODE_PATH = "$env:APPDATA\npm\node_modules"; npx expo start --tunnel
```
