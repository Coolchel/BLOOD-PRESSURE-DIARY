(function(root){
  const catalog={
  "Экспорт JSON": {
    "en": "Export JSON", "fr": "Exporter en JSON", "es": "Exportar JSON", "de": "JSON exportieren"
  },
  "Измерения, замеры и периоды · .json": {
    "en": "Records, readings and periods · .json", "fr": "Mesures, relevés et périodes · .json", "es": "Registros, lecturas y períodos · .json", "de": "Einträge, Messungen und Zeiträume · .json"
  },
  "Поделиться файлом недоступно на этом устройстве.": {
    "en": "File sharing is unavailable on this device.", "fr": "Le partage de fichiers est indisponible sur cet appareil.", "es": "No se pueden compartir archivos en este dispositivo.", "de": "Dateifreigabe ist auf diesem Gerät nicht verfügbar."
  },
  "Последние {{0}} дней": {
    "en": "Last {{0}} days",
    "fr": "Les {{0}} derniers jours",
    "es": "Últimos {{0}} días",
    "de": "Letzte {{0}} Tage"
  },
  "Тихий ритм": {
    "en": "Quiet rhythm",
    "fr": "Rythme paisible",
    "es": "Ritmo tranquilo",
    "de": "Ruhiger Rhythmus"
  },
  "Сдержанный зелёный, ясная иерархия и воздух между блоками. Последний замер — главный. Остальные показатели поддерживают его.": {
    "en": "Calm green, a clear hierarchy and space between sections. The latest reading comes first; the other values support it.",
    "fr": "Un vert discret, une hiérarchie claire et des espaces entre les sections. Le dernier relevé est mis en avant ; les autres valeurs le complètent.",
    "es": "Verde sereno, jerarquía clara y espacio entre secciones. La última medición ocupa el lugar principal; los demás valores la acompañan.",
    "de": "Ruhiges Grün, klare Hierarchie und Abstand zwischen den Bereichen. Die letzte Messung steht im Mittelpunkt; die anderen Werte ergänzen sie."
  },
  "Спокойная палитра": {
    "en": "Calm palette",
    "fr": "Palette apaisante",
    "es": "Paleta serena",
    "de": "Ruhige Farbpalette"
  },
  "Ясная иерархия": {
    "en": "Clear hierarchy",
    "fr": "Hiérarchie claire",
    "es": "Jerarquía clara",
    "de": "Klare Hierarchie"
  },
  "Модульные карточки": {
    "en": "Modular cards",
    "fr": "Cartes modulaires",
    "es": "Tarjetas modulares",
    "de": "Modulare Karten"
  },
  "Давление": {
    "en": "Blood pressure",
    "fr": "Pression artérielle",
    "es": "Presión arterial",
    "de": "Blutdruck"
  },
  "Коралл": {
    "en": "Coral",
    "fr": "Corail",
    "es": "Coral",
    "de": "Koralle"
  },
  "Знакомый коралловый характер, переосмысленный в тёплых оттенках. Выразительные цифры, мягкие карточки и компактная навигация.": {
    "en": "Familiar coral colours in warmer shades. Clear numbers, soft cards and compact navigation.",
    "fr": "Des couleurs corail revisitées dans des tons chauds. Des chiffres lisibles, des cartes douces et une navigation compacte.",
    "es": "El conocido color coral en tonos más cálidos. Cifras claras, tarjetas suaves y navegación compacta.",
    "de": "Vertraute Korallfarben in wärmeren Tönen. Klare Zahlen, sanfte Karten und kompakte Navigation."
  },
  "Тёплые оттенки": {
    "en": "Warm colours",
    "fr": "Couleurs chaudes",
    "es": "Tonos cálidos",
    "de": "Warme Farben"
  },
  "Мягкие формы": {
    "en": "Soft shapes",
    "fr": "Formes douces",
    "es": "Formas suaves",
    "de": "Sanfte Formen"
  },
  "Карточки показателей": {
    "en": "Metric cards",
    "fr": "Cartes de valeurs",
    "es": "Tarjetas de valores",
    "de": "Messwertkarten"
  },
  "Мой дневник": {
    "en": "My diary",
    "fr": "Mon journal",
    "es": "Mi diario",
    "de": "Mein Tagebuch"
  },
  "Ночной пульс": {
    "en": "Night pulse",
    "fr": "Pouls nocturne",
    "es": "Pulso nocturno",
    "de": "Nachtpuls"
  },
  "Тёмная приборная эстетика. Чёткие цифры, графитовые поверхности и световые акценты. Данные остаются в центре внимания.": {
    "en": "A dark instrument-inspired look. Precise numbers, graphite surfaces and subtle highlights. The data stays in focus.",
    "fr": "Un style sombre inspiré des instruments. Des chiffres précis, des surfaces graphite et des accents lumineux. Les données restent au premier plan.",
    "es": "Un diseño oscuro inspirado en instrumentos. Cifras precisas, superficies de grafito y acentos de luz sutiles. Los datos siguen siendo protagonistas.",
    "de": "Ein dunkles, von Messgeräten inspiriertes Design. Präzise Zahlen, graphitfarbene Flächen und dezente Lichtakzente. Die Daten stehen im Mittelpunkt."
  },
  "Тёмный интерфейс": {
    "en": "Dark interface",
    "fr": "Interface sombre",
    "es": "Interfaz oscura",
    "de": "Dunkle Oberfläche"
  },
  "Приборные цифры": {
    "en": "Precise numbers",
    "fr": "Chiffres précis",
    "es": "Cifras precisas",
    "de": "Präzise Zahlen"
  },
  "Высокий контраст": {
    "en": "High contrast",
    "fr": "Contraste élevé",
    "es": "Alto contraste",
    "de": "Hoher Kontrast"
  },
  "Пульс дня": {
    "en": "Today's pulse",
    "fr": "Pouls du jour",
    "es": "Pulso del día",
    "de": "Tagespuls"
  },
  "Ясно": {
    "en": "Clarity",
    "fr": "Clarté",
    "es": "Claridad",
    "de": "Klarheit"
  },
  "Дневник с характером печатной страницы. Крупный текст, простые формы и минимум украшений. Легче читать и проще нажимать.": {
    "en": "A diary inspired by a printed page. Large text, simple shapes and minimal decoration. Easy to read and tap.",
    "fr": "Un journal inspiré d'une page imprimée. De grands textes, des formes simples et peu de décorations. Facile à lire et à utiliser.",
    "es": "Un diario inspirado en una página impresa. Texto grande, formas sencillas y pocos adornos. Fácil de leer y de usar.",
    "de": "Ein Tagebuch wie eine gedruckte Seite. Große Schrift, einfache Formen und wenige Verzierungen. Leicht zu lesen und zu bedienen."
  },
  "Крупный текст": {
    "en": "Large text",
    "fr": "Grands textes",
    "es": "Texto grande",
    "de": "Große Schrift"
  },
  "Простые формы": {
    "en": "Simple shapes",
    "fr": "Formes simples",
    "es": "Formas sencillas",
    "de": "Einfache Formen"
  },
  "Бумажная эстетика": {
    "en": "Paper-inspired style",
    "fr": "Style papier",
    "es": "Estilo de papel",
    "de": "Papierstil"
  },
  "Идёт сейчас": {
    "en": "Ongoing",
    "fr": "En cours",
    "es": "En curso",
    "de": "Laufend"
  },
  "Запланирован": {
    "en": "Scheduled",
    "fr": "Prévu",
    "es": "Programado",
    "de": "Geplant"
  },
  "Завершён": {
    "en": "Completed",
    "fr": "Terminé",
    "es": "Finalizado",
    "de": "Abgeschlossen"
  },
  "с": {
    "en": "from",
    "fr": "depuis le",
    "es": "desde",
    "de": "ab"
  },
  "сейчас": {
    "en": "now",
    "fr": "maintenant",
    "es": "ahora",
    "de": "jetzt"
  },
  "записей": {
    "en": "records",
    "fr": "mesures",
    "es": "registros",
    "de": "Einträge"
  },
  "запись": {
    "en": "record",
    "fr": "mesure",
    "es": "registro",
    "de": "Eintrag"
  },
  "записи": {
    "en": "records",
    "fr": "mesures",
    "es": "registros",
    "de": "Einträge"
  },
  "периодов": {
    "en": "periods",
    "fr": "périodes",
    "es": "períodos",
    "de": "Zeiträume"
  },
  "период": {
    "en": "period",
    "fr": "période",
    "es": "período",
    "de": "Zeitraum"
  },
  "периода": {
    "en": "periods",
    "fr": "périodes",
    "es": "períodos",
    "de": "Zeiträume"
  },
  "замер": {
    "en": "reading",
    "fr": "relevé",
    "es": "medición",
    "de": "Messung"
  },
  "замера": {
    "en": "readings",
    "fr": "relevés",
    "es": "mediciones",
    "de": "Messungen"
  },
  "замеров": {
    "en": "readings",
    "fr": "relevés",
    "es": "mediciones",
    "de": "Messungen"
  },
  "Верхнее": {
    "en": "Systolic",
    "fr": "Systolique",
    "es": "Sistólica",
    "de": "Systolisch"
  },
  "Нижнее": {
    "en": "Diastolic",
    "fr": "Diastolique",
    "es": "Diastólica",
    "de": "Diastolisch"
  },
  "Пульс": {
    "en": "Pulse",
    "fr": "Pouls",
    "es": "Pulso",
    "de": "Puls"
  },
  "Версия данных не поддерживается.": {
    "en": "This data version is not supported.",
    "fr": "Cette version des données n'est pas prise en charge.",
    "es": "Esta versión de los datos no es compatible.",
    "de": "Diese Datenversion wird nicht unterstützt."
  },
  "непустую": {
    "en": "non-empty",
    "fr": "non vide",
    "es": "no vacía",
    "de": "nicht leer"
  },
  "Не удалось прочитать сохранённый дневник. Используются тестовые данные; исходное хранилище не перезаписывается.": {
    "en": "The saved diary could not be read. Demo data is shown; the original storage will not be overwritten.",
    "fr": "Le journal enregistré est illisible. Des données de démonstration sont affichées ; les données d'origine ne sont pas remplacées.",
    "es": "No se pudo leer el diario guardado. Se muestran datos de prueba; el almacenamiento original no se sobrescribe.",
    "de": "Das gespeicherte Tagebuch konnte nicht gelesen werden. Es werden Testdaten angezeigt; der ursprüngliche Speicher wird nicht überschrieben."
  },
  "ДАВЛЕНИЕ / ДИЗАЙН": {
    "en": "BLOOD PRESSURE / DESIGN",
    "fr": "PRESSION ARTÉRIELLE / DESIGN",
    "es": "PRESIÓN ARTERIAL / DISEÑO",
    "de": "BLUTDRUCK / DESIGN"
  },
  "Вариант {{0}} из четырёх": {
    "en": "Design {{0}} of four",
    "fr": "Variante {{0}} sur quatre",
    "es": "Diseño {{0}} de cuatro",
    "de": "Design {{0}} von vier"
  },
  "Другие варианты": {
    "en": "Other designs",
    "fr": "Autres variantes",
    "es": "Otros diseños",
    "de": "Andere Designs"
  },
  "Рабочий прототип · данные сохраняются": {
    "en": "Working prototype · data is saved",
    "fr": "Prototype fonctionnel · données enregistrées",
    "es": "Prototipo funcional · datos guardados",
    "de": "Funktionsfähiger Prototyp · Daten werden gespeichert"
  },
  "{{0}} Все варианты": {
    "en": "{{0}} All designs",
    "fr": "{{0}} Toutes les variantes",
    "es": "{{0}} Todos los diseños",
    "de": "{{0}} Alle Designs"
  },
  "Разделы приложения": {
    "en": "App sections",
    "fr": "Sections de l'application",
    "es": "Secciones de la aplicación",
    "de": "App-Bereiche"
  },
  "Нажимайте на экран. Все данные здесь — тестовые.": {
    "en": "Tap the screen. All data here is for demonstration.",
    "fr": "Touchez l'écran. Toutes les données présentées sont des exemples.",
    "es": "Toca la pantalla. Todos los datos son de demostración.",
    "de": "Tippe auf den Bildschirm. Alle Daten dienen der Demonstration."
  },
  "Период завершён": {
    "en": "Period completed",
    "fr": "Période terminée",
    "es": "Período finalizado",
    "de": "Zeitraum abgeschlossen"
  },
  "Период создан": {
    "en": "Period created",
    "fr": "Période créée",
    "es": "Período creado",
    "de": "Zeitraum erstellt"
  },
  "Серия сохранена": {
    "en": "Series saved",
    "fr": "Série enregistrée",
    "es": "Serie guardada",
    "de": "Serie gespeichert"
  },
  "Измерение сохранено": {
    "en": "Measurement saved",
    "fr": "Mesure enregistrée",
    "es": "Medición guardada",
    "de": "Messung gespeichert"
  },
  "исходное хранилище": {
    "en": "original storage",
    "fr": "stockage d'origine",
    "es": "almacenamiento original",
    "de": "ursprünglicher Speicher"
  },
  "Сначала скачайте копию исходного хранилища или используйте другой вариант.": {
    "en": "Save a copy of the original data first or use another design.",
    "fr": "Enregistrez d'abord une copie des données d'origine ou utilisez une autre variante.",
    "es": "Descarga una copia de los datos originales o utiliza otro diseño.",
    "de": "Lade zuerst eine Kopie der ursprünglichen Daten herunter oder verwende ein anderes Design."
  },
  "Не удалось сохранить:": {
    "en": "Could not save:",
    "fr": "Enregistrement impossible :",
    "es": "No se pudo guardar:",
    "de": "Speichern fehlgeschlagen:"
  },
  "Не удалось сохранить настройки статистики.": {
    "en": "The statistics settings could not be saved.",
    "fr": "Les réglages des statistiques n'ont pas pu être enregistrés.",
    "es": "No se pudieron guardar los ajustes de estadísticas.",
    "de": "Die Statistikeinstellungen konnten nicht gespeichert werden."
  },
  "Измерение {{0}}, {{1}} на {{2}}, пульс {{3}}, самочувствие {{4}} из 10": {
    "en": "Measurement {{0}}, {{1}} over {{2}}, pulse {{3}}, wellbeing {{4}} out of 10",
    "fr": "Mesure {{0}}, {{1}} sur {{2}}, pouls {{3}}, bien-être {{4}} sur 10",
    "es": "Medición {{0}}, {{1}} sobre {{2}}, pulso {{3}}, bienestar {{4}} de 10",
    "de": "Messung {{0}}, {{1}} zu {{2}}, Puls {{3}}, Wohlbefinden {{4}} von 10"
  },
  "Самочувствие": {
    "en": "Wellbeing",
    "fr": "Bien-être",
    "es": "Bienestar",
    "de": "Wohlbefinden"
  },
  "Серия ·": {
    "en": "Series ·",
    "fr": "Série ·",
    "es": "Serie ·",
    "de": "Serie ·"
  },
  "Одиночный замер": {
    "en": "Single reading",
    "fr": "Relevé unique",
    "es": "Medición individual",
    "de": "Einzelmessung"
  },
  "Среднее давление": {
    "en": "Average blood pressure",
    "fr": "Pression moyenne",
    "es": "Presión media",
    "de": "Durchschnittlicher Blutdruck"
  },
  "Измерение {{0}}, {{1}} на {{2}}": {
    "en": "Measurement {{0}}, {{1}} over {{2}}",
    "fr": "Mesure {{0}}, {{1}} sur {{2}}",
    "es": "Medición {{0}}, {{1}} sobre {{2}}",
    "de": "Messung {{0}}, {{1}} zu {{2}}"
  },
  "Самочувствие {{0}}/10": {
    "en": "Wellbeing {{0}}/10",
    "fr": "Bien-être {{0}}/10",
    "es": "Bienestar {{0}}/10",
    "de": "Wohlbefinden {{0}}/10"
  },
  "Один замер": {
    "en": "Single reading",
    "fr": "Relevé unique",
    "es": "Una medición",
    "de": "Eine Messung"
  },
  "Верхнее давление": {
    "en": "Systolic pressure",
    "fr": "Pression systolique",
    "es": "Presión sistólica",
    "de": "Systolischer Blutdruck"
  },
  "мм рт. ст.": {
    "en": "mmHg",
    "fr": "mmHg",
    "es": "mmHg",
    "de": "mmHg"
  },
  "Нижнее давление": {
    "en": "Diastolic pressure",
    "fr": "Pression diastolique",
    "es": "Presión diastólica",
    "de": "Diastolischer Blutdruck"
  },
  "уд/мин": {
    "en": "bpm",
    "fr": "bpm",
    "es": "lat/min",
    "de": "Schläge/min"
  },
  "из 10": {
    "en": "out of 10",
    "fr": "sur 10",
    "es": "de 10",
    "de": "von 10"
  },
  "пульс": {
    "en": "pulse",
    "fr": "pouls",
    "es": "pulso",
    "de": "Puls"
  },
  "самочувствие": {
    "en": "wellbeing",
    "fr": "bien-être",
    "es": "bienestar",
    "de": "Wohlbefinden"
  },
  "Все значения графика {{0}}": {
    "en": "All chart values: {{0}}",
    "fr": "Toutes les valeurs du graphique : {{0}}",
    "es": "Todos los valores del gráfico: {{0}}",
    "de": "Alle Diagrammwerte: {{0}}"
  },
  "Нижнее · пунктир": {
    "en": "Diastolic · dashed",
    "fr": "Diastolique · pointillés",
    "es": "Diastólica · discontinua",
    "de": "Diastolisch · gestrichelt"
  },
  "Пульс · уд/мин": {
    "en": "Pulse · bpm",
    "fr": "Pouls · bpm",
    "es": "Pulso · lat/min",
    "de": "Puls · Schläge/min"
  },
  "Самочувствие · 1–10": {
    "en": "Wellbeing · 1–10",
    "fr": "Bien-être · 1–10",
    "es": "Bienestar · 1–10",
    "de": "Wohlbefinden · 1–10"
  },
  "Нажмите на точку, чтобы увидеть значения.": {
    "en": "Tap a point to see its values.",
    "fr": "Touchez un point pour voir ses valeurs.",
    "es": "Toca un punto para ver sus valores.",
    "de": "Tippe auf einen Punkt, um seine Werte zu sehen."
  },
  "Средние по": {
    "en": "Averages across",
    "fr": "Moyennes sur",
    "es": "Promedios por",
    "de": "Mittelwerte nach"
  },
  "временным интервалам. Исходные записи — в таблице.": {
    "en": "time intervals. Original records are in the table.",
    "fr": "intervalles de temps. Les mesures d'origine sont dans le tableau.",
    "es": "intervalos de tiempo. Los registros originales están en la tabla.",
    "de": "Zeitintervallen. Die ursprünglichen Einträge stehen in der Tabelle."
  },
  "Каждая точка — запись; для серии показано среднее.": {
    "en": "Each point is a record; a series is shown as its average.",
    "fr": "Chaque point est une mesure ; une série est représentée par sa moyenne.",
    "es": "Cada punto es un registro; una serie se muestra como su promedio.",
    "de": "Jeder Punkt ist ein Eintrag; bei Serien wird der Mittelwert angezeigt."
  },
  "Нет записей в этом интервале": {
    "en": "No records in this range",
    "fr": "Aucune mesure dans cet intervalle",
    "es": "No hay registros en este intervalo",
    "de": "Keine Einträge in diesem Zeitraum"
  },
  "Выберите другой интервал или добавьте измерение.": {
    "en": "Choose another range or add a measurement.",
    "fr": "Choisissez un autre intervalle ou ajoutez une mesure.",
    "es": "Elige otro intervalo o añade una medición.",
    "de": "Wähle einen anderen Zeitraum oder füge eine Messung hinzu."
  },
  "{{0}} в {{1}}": {
    "en": "{{0}} at {{1}}",
    "fr": "{{0}} à {{1}}",
    "es": "{{0}} a las {{1}}",
    "de": "{{0}} um {{1}}"
  },
  "{{0}}: {{1}} на {{2}}, пульс {{3}}, самочувствие {{4}} из 10, {{5}}": {
    "en": "{{0}}: {{1}} over {{2}}, pulse {{3}}, wellbeing {{4}} out of 10, {{5}}",
    "fr": "{{0}} : {{1}} sur {{2}}, pouls {{3}}, bien-être {{4}} sur 10, {{5}}",
    "es": "{{0}}: {{1}} sobre {{2}}, pulso {{3}}, bienestar {{4}} de 10, {{5}}",
    "de": "{{0}}: {{1}} zu {{2}}, Puls {{3}}, Wohlbefinden {{4}} von 10, {{5}}"
  },
  "Последнее измерение": {
    "en": "Latest measurement",
    "fr": "Dernière mesure",
    "es": "Última medición",
    "de": "Letzte Messung"
  },
  "Измерение": {
    "en": "Measurement",
    "fr": "Mesure",
    "es": "Medición",
    "de": "Messung"
  },
  "Без периода": {
    "en": "No period",
    "fr": "Sans période",
    "es": "Sin período",
    "de": "Ohne Zeitraum"
  },
  "Запланирован ·": {
    "en": "Scheduled ·",
    "fr": "Prévu ·",
    "es": "Programado ·",
    "de": "Geplant ·"
  },
  "Выбрать период наблюдения": {
    "en": "Choose an observation period",
    "fr": "Choisir une période de suivi",
    "es": "Elegir un período de seguimiento",
    "de": "Beobachtungszeitraum wählen"
  },
  "Активные периоды": {
    "en": "Active periods",
    "fr": "Périodes actives",
    "es": "Períodos activos",
    "de": "Aktive Zeiträume"
  },
  "Исходные замеры": {
    "en": "Original readings",
    "fr": "Relevés d'origine",
    "es": "Mediciones originales",
    "de": "Ursprüngliche Messungen"
  },
  "Дата и время": {
    "en": "Date and time",
    "fr": "Date et heure",
    "es": "Fecha y hora",
    "de": "Datum und Uhrzeit"
  },
  "Показания": {
    "en": "Readings",
    "fr": "Valeurs",
    "es": "Valores",
    "de": "Messwerte"
  },
  "Периоды": {
    "en": "Periods",
    "fr": "Périodes",
    "es": "Períodos",
    "de": "Zeiträume"
  },
  "Период": {
    "en": "Period",
    "fr": "Période",
    "es": "Período",
    "de": "Zeitraum"
  },
  "Оценка": {
    "en": "Score",
    "fr": "Score",
    "es": "Puntuación",
    "de": "Bewertung"
  },
  "{{0}} из 10": {
    "en": "{{0}} out of 10",
    "fr": "{{0}} sur 10",
    "es": "{{0}} de 10",
    "de": "{{0}} von 10"
  },
  "Заметка": {
    "en": "Note",
    "fr": "Note",
    "es": "Nota",
    "de": "Notiz"
  },
  "Что важно помнить об этом измерении?": {
    "en": "What should you remember about this measurement?",
    "fr": "Que souhaitez-vous retenir de cette mesure ?",
    "es": "¿Qué conviene recordar de esta medición?",
    "de": "Was ist bei dieser Messung zu beachten?"
  },
  "мм рт. ст. {{0}}": {
    "en": "mmHg {{0}}",
    "fr": "mmHg {{0}}",
    "es": "mmHg {{0}}",
    "de": "mmHg {{0}}"
  },
  "сохранено": {
    "en": "saved",
    "fr": "enregistrées",
    "es": "guardados",
    "de": "gespeichert"
  },
  "Ваш первый замер": {
    "en": "Your first reading",
    "fr": "Votre premier relevé",
    "es": "Tu primera medición",
    "de": "Deine erste Messung"
  },
  "Добавьте измерение, чтобы начать дневник.": {
    "en": "Add a measurement to start your diary.",
    "fr": "Ajoutez une mesure pour commencer votre journal.",
    "es": "Añade una medición para empezar el diario.",
    "de": "Füge eine Messung hinzu, um das Tagebuch zu beginnen."
  },
  "{{0}}Новое измерение": {
    "en": "{{0}}New measurement",
    "fr": "{{0}}Nouvelle mesure",
    "es": "{{0}}Nueva medición",
    "de": "{{0}}Neue Messung"
  },
  "Продолжить запись": {
    "en": "Continue entry",
    "fr": "Continuer la saisie",
    "es": "Continuar registro",
    "de": "Eintrag fortsetzen"
  },
  "Предыдущее измерение": {
    "en": "Previous measurement",
    "fr": "Mesure précédente",
    "es": "Medición anterior",
    "de": "Vorherige Messung"
  },
  "Последние измерения": {
    "en": "Recent measurements",
    "fr": "Mesures récentes",
    "es": "Últimas mediciones",
    "de": "Letzte Messungen"
  },
  "Средние значения": {
    "en": "Average values",
    "fr": "Valeurs moyennes",
    "es": "Valores medios",
    "de": "Durchschnittswerte"
  },
  "Средний пульс · {{0}}": {
    "en": "Average pulse · {{0}}",
    "fr": "Pouls moyen · {{0}}",
    "es": "Pulso medio · {{0}}",
    "de": "Durchschnittlicher Puls · {{0}}"
  },
  "Среднее самочувствие": {
    "en": "Average wellbeing",
    "fr": "Bien-être moyen",
    "es": "Bienestar medio",
    "de": "Durchschnittliches Wohlbefinden"
  },
  "Динамика": {
    "en": "Trend",
    "fr": "Évolution",
    "es": "Evolución",
    "de": "Verlauf"
  },
  "Подробнее ↗": {
    "en": "More details ↗",
    "fr": "Plus de détails ↗",
    "es": "Más detalles ↗",
    "de": "Mehr Details ↗"
  },
  "Последние 12 измерений": {
    "en": "Last 12 measurements",
    "fr": "12 dernières mesures",
    "es": "Últimas 12 mediciones",
    "de": "Letzte 12 Messungen"
  },
  "Период: {{0}}": {
    "en": "Period: {{0}}",
    "fr": "Période : {{0}}",
    "es": "Período: {{0}}",
    "de": "Zeitraum: {{0}}"
  },
  "Вся статистика ↗": {
    "en": "All statistics ↗",
    "fr": "Toutes les statistiques ↗",
    "es": "Todas las estadísticas ↗",
    "de": "Alle Statistiken ↗"
  },
  "Сначала новые": {
    "en": "Newest first",
    "fr": "Les plus récentes",
    "es": "Más recientes primero",
    "de": "Neueste zuerst"
  },
  "Сначала старые": {
    "en": "Oldest first",
    "fr": "Les plus anciennes",
    "es": "Más antiguos primero",
    "de": "Älteste zuerst"
  },
  "· по убыванию": {
    "en": "· descending",
    "fr": "· décroissant",
    "es": "· descendente",
    "de": "· absteigend"
  },
  "· по возрастанию": {
    "en": "· ascending",
    "fr": "· croissant",
    "es": "· ascendente",
    "de": "· aufsteigend"
  },
  "Сегодня": {
    "en": "Today",
    "fr": "Aujourd'hui",
    "es": "Hoy",
    "de": "Heute"
  },
  "7 дней": {
    "en": "7 days",
    "fr": "7 jours",
    "es": "7 días",
    "de": "7 Tage"
  },
  "30 дней": {
    "en": "30 days",
    "fr": "30 jours",
    "es": "30 días",
    "de": "30 Tage"
  },
  "С": {
    "en": "From",
    "fr": "Du",
    "es": "Desde",
    "de": "Von"
  },
  "По": {
    "en": "To",
    "fr": "Au",
    "es": "Hasta",
    "de": "Bis"
  },
  "Серии": {
    "en": "Series",
    "fr": "Séries",
    "es": "Series",
    "de": "Serien"
  },
  "Одиночные": {
    "en": "Single readings",
    "fr": "Relevés uniques",
    "es": "Individuales",
    "de": "Einzelmessungen"
  },
  "Период удалён": {
    "en": "Period deleted",
    "fr": "Période supprimée",
    "es": "Período eliminado",
    "de": "Zeitraum gelöscht"
  },
  "Отметки:": {
    "en": "Tags:",
    "fr": "Étiquettes :",
    "es": "Etiquetas:",
    "de": "Markierungen:"
  },
  "С заметкой": {
    "en": "With a note",
    "fr": "Avec une note",
    "es": "Con nota",
    "de": "Mit Notiz"
  },
  "Найдено записей": {
    "en": "Records found",
    "fr": "Mesures trouvées",
    "es": "Registros encontrados",
    "de": "Gefundene Einträge"
  },
  "Записей в дневнике": {
    "en": "Diary records",
    "fr": "Mesures du journal",
    "es": "Registros del diario",
    "de": "Einträge im Tagebuch"
  },
  "найдено": {
    "en": "found",
    "fr": "trouvées",
    "es": "encontrados",
    "de": "gefunden"
  },
  "в дневнике": {
    "en": "in diary",
    "fr": "dans le journal",
    "es": "en el diario",
    "de": "im Tagebuch"
  },
  "Выбранные фильтры": {
    "en": "Selected filters",
    "fr": "Filtres sélectionnés",
    "es": "Filtros seleccionados",
    "de": "Ausgewählte Filter"
  },
  "Сбросить все": {
    "en": "Clear all",
    "fr": "Tout effacer",
    "es": "Restablecer todos",
    "de": "Alle zurücksetzen"
  },
  "Убрать: {{0}}": {
    "en": "Remove: {{0}}",
    "fr": "Retirer : {{0}}",
    "es": "Quitar: {{0}}",
    "de": "Entfernen: {{0}}"
  },
  "Сбросить": {
    "en": "Reset",
    "fr": "Réinitialiser",
    "es": "Restablecer",
    "de": "Zurücksetzen"
  },
  "· с": {
    "en": "· from",
    "fr": "· depuis le",
    "es": "· desde",
    "de": "· ab"
  },
  "· по": {
    "en": "· to",
    "fr": "· jusqu'au",
    "es": "· hasta",
    "de": "· bis"
  },
  "Показать еще": {
    "en": "Show more",
    "fr": "Afficher plus",
    "es": "Mostrar más",
    "de": "Mehr anzeigen"
  },
  "Показать ещё · {{0}} из {{1}}": {
    "en": "Show more · {{0}} of {{1}}",
    "fr": "Afficher plus · {{0}} sur {{1}}",
    "es": "Mostrar más · {{0}} de {{1}}",
    "de": "Mehr anzeigen · {{0}} von {{1}}"
  },
  "Ничего не найдено": {
    "en": "Nothing found",
    "fr": "Aucun résultat",
    "es": "No se encontró nada",
    "de": "Nichts gefunden"
  },
  "История пока пустая": {
    "en": "History is empty",
    "fr": "L'historique est vide",
    "es": "El historial está vacío",
    "de": "Der Verlauf ist leer"
  },
  "Попробуйте убрать один из фильтров.": {
    "en": "Try removing a filter.",
    "fr": "Essayez de retirer un filtre.",
    "es": "Prueba a quitar un filtro.",
    "de": "Entferne einen der Filter."
  },
  "Измените даты в фильтрах.": {
    "en": "Change the filter dates.",
    "fr": "Modifiez les dates des filtres.",
    "es": "Cambia las fechas de los filtros.",
    "de": "Ändere die Filterdaten."
  },
  "Сохранённые измерения появятся здесь.": {
    "en": "Saved measurements will appear here.",
    "fr": "Les mesures enregistrées apparaîtront ici.",
    "es": "Las mediciones guardadas aparecerán aquí.",
    "de": "Gespeicherte Messungen werden hier angezeigt."
  },
  "Сбросить фильтры": {
    "en": "Reset filters",
    "fr": "Réinitialiser les filtres",
    "es": "Restablecer filtros",
    "de": "Filter zurücksetzen"
  },
  "Все записи": {
    "en": "All records",
    "fr": "Toutes les mesures",
    "es": "Todos los registros",
    "de": "Alle Einträge"
  },
  "Последние": {
    "en": "Last",
    "fr": "Derniers",
    "es": "Últimos",
    "de": "Letzte"
  },
  "дней": {
    "en": "days",
    "fr": "jours",
    "es": "días",
    "de": "Tage"
  },
  "Интервал или период наблюдения": {
    "en": "Date range or observation period",
    "fr": "Intervalle de dates ou période de suivi",
    "es": "Intervalo de fechas o período de seguimiento",
    "de": "Datumsbereich oder Beobachtungszeitraum"
  },
  "По времени": {
    "en": "By date",
    "fr": "Par date",
    "es": "Por fecha",
    "de": "Nach Datum"
  },
  "Показатель графика": {
    "en": "Chart metric",
    "fr": "Valeur du graphique",
    "es": "Valor del gráfico",
    "de": "Diagrammwert"
  },
  "Интервал статистики": {
    "en": "Statistics range",
    "fr": "Intervalle des statistiques",
    "es": "Intervalo de estadísticas",
    "de": "Statistikzeitraum"
  },
  "90 дней": {
    "en": "90 days",
    "fr": "90 jours",
    "es": "90 días",
    "de": "90 Tage"
  },
  "Всё": {
    "en": "All",
    "fr": "Tout",
    "es": "Todo",
    "de": "Alle"
  },
  "Записей пока нет": {
    "en": "No records yet",
    "fr": "Aucune mesure pour le moment",
    "es": "Aún no hay registros",
    "de": "Noch keine Einträge"
  },
  "Давление · мм рт. ст.": {
    "en": "Blood pressure · mmHg",
    "fr": "Pression artérielle · mmHg",
    "es": "Presión arterial · mmHg",
    "de": "Blutdruck · mmHg"
  },
  "Самочувствие · баллы": {
    "en": "Wellbeing · points",
    "fr": "Bien-être · points",
    "es": "Bienestar · puntos",
    "de": "Wohlbefinden · Punkte"
  },
  "{{0}} · {{1}}. Серия учитывается как одна запись.": {
    "en": "{{0}} · {{1}}. A series counts as one record.",
    "fr": "{{0}} · {{1}}. Une série compte comme une seule mesure.",
    "es": "{{0}} · {{1}}. Una serie cuenta como un registro.",
    "de": "{{0}} · {{1}}. Eine Serie zählt als ein Eintrag."
  },
  "Диапазон замеров": {
    "en": "Reading range",
    "fr": "Plage des relevés",
    "es": "Rango de mediciones",
    "de": "Messwertbereich"
  },
  "Самые низкие и высокие значения. В серии учитывается каждый замер.": {
    "en": "Lowest and highest values. Every reading in a series is included.",
    "fr": "Valeurs les plus basses et les plus hautes. Chaque relevé d'une série est pris en compte.",
    "es": "Valores más bajos y más altos. Se incluye cada medición de una serie.",
    "de": "Niedrigste und höchste Werte. Jede Messung einer Serie wird berücksichtigt."
  },
  "Выберите период": {
    "en": "Choose a period",
    "fr": "Choisir une période",
    "es": "Elige un período",
    "de": "Zeitraum wählen"
  },
  "Выбранные даты": {
    "en": "Selected dates",
    "fr": "Dates sélectionnées",
    "es": "Fechas seleccionadas",
    "de": "Ausgewählte Daten"
  },
  "· запланирован": {
    "en": "· scheduled",
    "fr": "· prévu",
    "es": "· programado",
    "de": "· geplant"
  },
  "Даты и периоды": {
    "en": "Dates and periods",
    "fr": "Dates et périodes",
    "es": "Fechas y períodos",
    "de": "Daten und Zeiträume"
  },
  "Даты и периоды: {{0}}, {{1}}": {
    "en": "Dates and periods: {{0}}, {{1}}",
    "fr": "Dates et périodes : {{0}}, {{1}}",
    "es": "Fechas y períodos: {{0}}, {{1}}",
    "de": "Daten und Zeiträume: {{0}}, {{1}}"
  },
  "Сравнить периоды и даты": {
    "en": "Compare periods and dates",
    "fr": "Comparer les périodes et les dates",
    "es": "Comparar períodos y fechas",
    "de": "Zeiträume und Daten vergleichen"
  },
  "— сейчас": {
    "en": "— now",
    "fr": "— maintenant",
    "es": "— ahora",
    "de": "— jetzt"
  },
  "Период «{{0}}»": {
    "en": "Period “{{0}}”",
    "fr": "Période « {{0}} »",
    "es": "Período «{{0}}»",
    "de": "Zeitraum „{{0}}“"
  },
  "· Запланирован": {
    "en": "· Scheduled",
    "fr": "· Prévu",
    "es": "· Programado",
    "de": "· Geplant"
  },
  "Данные за всё время": {
    "en": "Data for all time",
    "fr": "Données sur toute la durée",
    "es": "Datos de todo el historial",
    "de": "Daten aus dem gesamten Verlauf"
  },
  "Измерений пока нет": {
    "en": "No measurements yet",
    "fr": "Aucune mesure pour le moment",
    "es": "Aún no hay mediciones",
    "de": "Noch keine Messungen"
  },
  "Данные за": {
    "en": "Data for",
    "fr": "Données du",
    "es": "Datos de",
    "de": "Daten für"
  },
  "Выбранный интервал статистики": {
    "en": "Selected statistics range",
    "fr": "Intervalle des statistiques sélectionné",
    "es": "Intervalo de estadísticas seleccionado",
    "de": "Ausgewählter Statistikzeitraum"
  },
  "Верхнее + нижнее": {
    "en": "Systolic + diastolic",
    "fr": "Systolique + diastolique",
    "es": "Sistólica + diastólica",
    "de": "Systolisch + diastolisch"
  },
  "Верхнее + нижнее + пульс": {
    "en": "Systolic + diastolic + pulse",
    "fr": "Systolique + diastolique + pouls",
    "es": "Sistólica + diastólica + pulso",
    "de": "Systolisch + diastolisch + Puls"
  },
  "Способ расчёта": {
    "en": "Calculation method",
    "fr": "Méthode de calcul",
    "es": "Método de cálculo",
    "de": "Berechnungsmethode"
  },
  "Среднее": {
    "en": "Mean",
    "fr": "Moyenne",
    "es": "Media",
    "de": "Mittelwert"
  },
  "Медиана": {
    "en": "Median",
    "fr": "Médiane",
    "es": "Mediana",
    "de": "Median"
  },
  "мм рт. ст. · уд/мин": {
    "en": "mmHg · bpm",
    "fr": "mmHg · bpm",
    "es": "mmHg · lat/min",
    "de": "mmHg · Schläge/min"
  },
  "Выбрать показатели графика": {
    "en": "Choose chart metrics",
    "fr": "Choisir les valeurs du graphique",
    "es": "Elegir valores del gráfico",
    "de": "Diagrammwerte wählen"
  },
  "{{0}}Показатели{{1}}": {
    "en": "{{0}}Metrics{{1}}",
    "fr": "{{0}}Valeurs{{1}}",
    "es": "{{0}}Valores{{1}}",
    "de": "{{0}}Messwerte{{1}}"
  },
  "Минимум": {
    "en": "Minimum",
    "fr": "Minimum",
    "es": "Mínimo",
    "de": "Minimum"
  },
  "Максимум": {
    "en": "Maximum",
    "fr": "Maximum",
    "es": "Máximo",
    "de": "Maximum"
  },
  "минимум": {
    "en": "minimum",
    "fr": "minimum",
    "es": "mínimo",
    "de": "Minimum"
  },
  "максимум": {
    "en": "maximum",
    "fr": "maximum",
    "es": "máximo",
    "de": "Maximum"
  },
  "Нет измерений": {
    "en": "No measurements",
    "fr": "Aucune mesure",
    "es": "No hay mediciones",
    "de": "Keine Messungen"
  },
  "Без даты": {
    "en": "No date",
    "fr": "Sans date",
    "es": "Sin fecha",
    "de": "Ohne Datum"
  },
  "Сейчас": {
    "en": "Now",
    "fr": "Maintenant",
    "es": "Ahora",
    "de": "Jetzt"
  },
  "Что сравниваем": {
    "en": "Comparison type",
    "fr": "Type de comparaison",
    "es": "Tipo de comparación",
    "de": "Vergleichsart"
  },
  "Даты": {
    "en": "Dates",
    "fr": "Dates",
    "es": "Fechas",
    "de": "Daten"
  },
  "Нужны два периода": {
    "en": "Two periods needed",
    "fr": "Deux périodes sont nécessaires",
    "es": "Se necesitan dos períodos",
    "de": "Zwei Zeiträume erforderlich"
  },
  "Создайте ещё один период или сравните два диапазона дат.": {
    "en": "Create another period or compare two date ranges.",
    "fr": "Créez une autre période ou comparez deux intervalles de dates.",
    "es": "Crea otro período o compara dos intervalos de fechas.",
    "de": "Erstelle einen weiteren Zeitraum oder vergleiche zwei Datumsbereiche."
  },
  "Сравнить даты": {
    "en": "Compare dates",
    "fr": "Comparer les dates",
    "es": "Comparar fechas",
    "de": "Daten vergleichen"
  },
  "Свои даты": {
    "en": "Custom dates",
    "fr": "Dates personnalisées",
    "es": "Fechas personalizadas",
    "de": "Eigene Daten"
  },
  "Всё время": {
    "en": "All time",
    "fr": "Toute la durée",
    "es": "Todo el historial",
    "de": "Gesamter Verlauf"
  },
  "Изменить {{0}} {{1}}: {{2}}, {{3}}": {
    "en": "Edit the {{0}} {{1}}: {{2}}, {{3}}",
    "fr": "Modifier le {{0}} {{1}} : {{2}}, {{3}}",
    "es": "Editar {{0}} {{1}}: {{2}}, {{3}}",
    "de": "{{0}} {{1}} ändern: {{2}}, {{3}}"
  },
  "первый": {
    "en": "first",
    "fr": "premier",
    "es": "primer",
    "de": "Erster"
  },
  "второй": {
    "en": "second",
    "fr": "second",
    "es": "segundo",
    "de": "Zweiter"
  },
  "диапазон": {
    "en": "range",
    "fr": "intervalle",
    "es": "intervalo",
    "de": "Bereich"
  },
  "Способ сравнения: {{0}}": {
    "en": "Comparison method: {{0}}",
    "fr": "Méthode de comparaison : {{0}}",
    "es": "Método de comparación: {{0}}",
    "de": "Vergleichsmethode: {{0}}"
  },
  "Способ расчёта сравнения": {
    "en": "Comparison calculation method",
    "fr": "Méthode de calcul de la comparaison",
    "es": "Método de cálculo de la comparación",
    "de": "Berechnungsmethode des Vergleichs"
  },
  "{{0}} и разница": {
    "en": "{{0}} and difference",
    "fr": "{{0}} et différence",
    "es": "{{0}} y diferencia",
    "de": "{{0}} und Differenz"
  },
  "Показатель": {
    "en": "Metric",
    "fr": "Valeur",
    "es": "Valor",
    "de": "Messwert"
  },
  "Первый": {
    "en": "First",
    "fr": "Premier",
    "es": "Primero",
    "de": "Erster"
  },
  "Второй": {
    "en": "Second",
    "fr": "Second",
    "es": "Segundo",
    "de": "Zweiter"
  },
  "Медианы": {
    "en": "Medians",
    "fr": "Médianes",
    "es": "Medianas",
    "de": "Mediane"
  },
  "Средние": {
    "en": "Means",
    "fr": "Moyennes",
    "es": "Medias",
    "de": "Mittelwerte"
  },
  "Разница: {{0}}": {
    "en": "Difference: {{0}}",
    "fr": "Différence : {{0}}",
    "es": "Diferencia: {{0}}",
    "de": "Differenz: {{0}}"
  },
  "ед.": {
    "en": "units",
    "fr": "unités",
    "es": "unid.",
    "de": "Einh."
  },
  "первого": {
    "en": "1",
    "fr": "1",
    "es": "1",
    "de": "1"
  },
  "второго": {
    "en": "2",
    "fr": "2",
    "es": "2",
    "de": "2"
  },
  "{{0}}История {{1}}": {
    "en": "{{0}}History {{1}}",
    "fr": "{{0}}Historique {{1}}",
    "es": "{{0}}Historial {{1}}",
    "de": "{{0}}Verlauf {{1}}"
  },
  "{{0}} за период": {
    "en": "{{0}} for the period",
    "fr": "{{0}} sur la période",
    "es": "{{0}} del período",
    "de": "{{0}} im Zeitraum"
  },
  "История измерений": {
    "en": "Measurement history",
    "fr": "Historique des mesures",
    "es": "Historial de mediciones",
    "de": "Messverlauf"
  },
  "Минимум и максимум": {
    "en": "Minimum and maximum",
    "fr": "Minimum et maximum",
    "es": "Mínimo y máximo",
    "de": "Minimum und Maximum"
  },
  "Нет измерений в этом интервале": {
    "en": "No measurements in this range",
    "fr": "Aucune mesure dans cet intervalle",
    "es": "No hay mediciones en este intervalo",
    "de": "Keine Messungen in diesem Zeitraum"
  },
  "Статистика появится после измерений": {
    "en": "Statistics will appear after measurements",
    "fr": "Les statistiques apparaîtront après les mesures",
    "es": "Las estadísticas aparecerán tras las mediciones",
    "de": "Statistiken erscheinen nach den ersten Messungen"
  },
  "Выберите другие даты или период.": {
    "en": "Choose other dates or a period.",
    "fr": "Choisissez d'autres dates ou une période.",
    "es": "Elige otras fechas u otro período.",
    "de": "Wähle andere Daten oder einen anderen Zeitraum."
  },
  "Добавьте первую запись в дневник.": {
    "en": "Add the first record to your diary.",
    "fr": "Ajoutez la première mesure à votre journal.",
    "es": "Añade el primer registro a tu diario.",
    "de": "Füge den ersten Eintrag zum Tagebuch hinzu."
  },
  "Показать всё": {
    "en": "Show all",
    "fr": "Tout afficher",
    "es": "Mostrar todo",
    "de": "Alle anzeigen"
  },
  "Новое измерение": {
    "en": "New measurement",
    "fr": "Nouvelle mesure",
    "es": "Nueva medición",
    "de": "Neue Messung"
  },
  "Показатели графика": {
    "en": "Chart metrics",
    "fr": "Valeurs du graphique",
    "es": "Valores del gráfico",
    "de": "Diagrammwerte"
  },
  "Отмена": {
    "en": "Cancel",
    "fr": "Annuler",
    "es": "Cancelar",
    "de": "Abbrechen"
  },
  "Готово": {
    "en": "Done",
    "fr": "Terminé",
    "es": "Listo",
    "de": "Fertig"
  },
  "Активные": {
    "en": "Active",
    "fr": "Actives",
    "es": "Activos",
    "de": "Aktiv"
  },
  "Завершённые": {
    "en": "Completed",
    "fr": "Terminées",
    "es": "Finalizados",
    "de": "Abgeschlossen"
  },
  "Выбор дат или периода": {
    "en": "Choose dates or a period",
    "fr": "Choisir des dates ou une période",
    "es": "Elegir fechas o período",
    "de": "Daten oder Zeitraum wählen"
  },
  "Быстрый интервал": {
    "en": "Quick range",
    "fr": "Intervalle rapide",
    "es": "Intervalo rápido",
    "de": "Schneller Zeitraum"
  },
  "Периоды наблюдения": {
    "en": "Observation periods",
    "fr": "Périodes de suivi",
    "es": "Períodos de seguimiento",
    "de": "Beobachtungszeiträume"
  },
  "Начало": {
    "en": "Start",
    "fr": "Début",
    "es": "Inicio",
    "de": "Beginn"
  },
  "Завершение": {
    "en": "End",
    "fr": "Fin",
    "es": "Finalización",
    "de": "Ende"
  },
  "{{0}} диапазона": {
    "en": "{{0}} of the range",
    "fr": "{{0}} de l'intervalle",
    "es": "{{0}} del intervalo",
    "de": "{{0}} des Bereichs"
  },
  "Применить": {
    "en": "Apply",
    "fr": "Appliquer",
    "es": "Aplicar",
    "de": "Anwenden"
  },
  "Выбор": {
    "en": "Select",
    "fr": "Sélection",
    "es": "Elegir",
    "de": "Auswahl"
  },
  "диапазона": {
    "en": "a range",
    "fr": "un intervalle",
    "es": "un intervalo",
    "de": "eines Bereichs"
  },
  "Нет записей": {
    "en": "No records",
    "fr": "Aucune mesure",
    "es": "No hay registros",
    "de": "Keine Einträge"
  },
  "диапазона:": {
    "en": "range:",
    "fr": "intervalle :",
    "es": "intervalo:",
    "de": "Bereich:"
  },
  "Средние за период": {
    "en": "Period averages",
    "fr": "Moyennes de la période",
    "es": "Promedios del período",
    "de": "Durchschnittswerte im Zeitraum"
  },
  "Измерений в периоде пока нет": {
    "en": "No measurements in this period yet",
    "fr": "Aucune mesure dans cette période pour le moment",
    "es": "Aún no hay mediciones en este período",
    "de": "Noch keine Messungen in diesem Zeitraum"
  },
  "Сравнение периодов": {
    "en": "Period comparison",
    "fr": "Comparaison des périodes",
    "es": "Comparación de períodos",
    "de": "Zeitraumvergleich"
  },
  "Сравнивать с периодом": {
    "en": "Compare with a period",
    "fr": "Comparer avec une période",
    "es": "Comparar con un período",
    "de": "Mit einem Zeitraum vergleichen"
  },
  "Разница средних значений. Периоды могут пересекаться.": {
    "en": "Difference between means. Periods may overlap.",
    "fr": "Différence entre les moyennes. Les périodes peuvent se chevaucher.",
    "es": "Diferencia entre medias. Los períodos pueden solaparse.",
    "de": "Differenz der Mittelwerte. Zeiträume können sich überschneiden."
  },
  "{{0}} · разница с «{{1}}»": {
    "en": "{{0}} · difference from “{{1}}”",
    "fr": "{{0}} · différence avec « {{1}} »",
    "es": "{{0}} · diferencia con «{{1}}»",
    "de": "{{0}} · Differenz zu „{{1}}“"
  },
  "мм": {
    "en": "mmHg",
    "fr": "mmHg",
    "es": "mmHg",
    "de": "mmHg"
  },
  "балл": {
    "en": "point",
    "fr": "point",
    "es": "punto",
    "de": "Punkt"
  },
  "Сравнение появится, когда будут измерения в другом периоде.": {
    "en": "Comparison will appear once another period has measurements.",
    "fr": "La comparaison apparaîtra lorsqu'une autre période contiendra des mesures.",
    "es": "La comparación aparecerá cuando haya mediciones en otro período.",
    "de": "Ein Vergleich erscheint, sobald ein anderer Zeitraum Messungen enthält."
  },
  "Пока не с чем сравнить": {
    "en": "Nothing to compare yet",
    "fr": "Aucune comparaison possible pour le moment",
    "es": "Aún no hay nada que comparar",
    "de": "Noch nichts zum Vergleichen"
  },
  "В выбранном периоде пока нет измерений.": {
    "en": "No measurements in the selected period yet.",
    "fr": "Aucune mesure dans la période sélectionnée pour le moment.",
    "es": "Aún no hay mediciones en el período seleccionado.",
    "de": "Noch keine Messungen im ausgewählten Zeitraum."
  },
  "Активных периодов пока нет.": {
    "en": "No active periods yet.",
    "fr": "Aucune période active pour le moment.",
    "es": "Aún no hay períodos activos.",
    "de": "Noch keine aktiven Zeiträume."
  },
  "Завершённых периодов пока нет.": {
    "en": "No completed periods yet.",
    "fr": "Aucune période terminée pour le moment.",
    "es": "Aún no hay períodos finalizados.",
    "de": "Noch keine abgeschlossenen Zeiträume."
  },
  "Создать новый период": {
    "en": "Create a new period",
    "fr": "Créer une nouvelle période",
    "es": "Crear un nuevo período",
    "de": "Neuen Zeitraum erstellen"
  },
  "Новый период": {
    "en": "New period",
    "fr": "Nouvelle période",
    "es": "Nuevo período",
    "de": "Neuer Zeitraum"
  },
  "Периодов пока нет": {
    "en": "No periods yet",
    "fr": "Aucune période pour le moment",
    "es": "Aún no hay períodos",
    "de": "Noch keine Zeiträume"
  },
  "Создайте период для новой привычки или изменения режима.": {
    "en": "Create a period for a new habit or a change in routine.",
    "fr": "Créez une période pour une nouvelle habitude ou un changement de rythme.",
    "es": "Crea un período para un nuevo hábito o cambio de rutina.",
    "de": "Erstelle einen Zeitraum für eine neue Gewohnheit oder eine Änderung im Alltag."
  },
  "Создать первый период": {
    "en": "Create the first period",
    "fr": "Créer la première période",
    "es": "Crear el primer período",
    "de": "Ersten Zeitraum erstellen"
  },
  "Период не найден": {
    "en": "Period not found",
    "fr": "Période introuvable",
    "es": "Período no encontrado",
    "de": "Zeitraum nicht gefunden"
  },
  "Вернитесь к списку периодов.": {
    "en": "Return to the period list.",
    "fr": "Revenez à la liste des périodes.",
    "es": "Vuelve a la lista de períodos.",
    "de": "Kehre zur Liste der Zeiträume zurück."
  },
  "Действия с периодом": {
    "en": "Period actions",
    "fr": "Actions de la période",
    "es": "Acciones del período",
    "de": "Zeitraumaktionen"
  },
  "{{0}}История измерений": {
    "en": "{{0}}Measurement history",
    "fr": "{{0}}Historique des mesures",
    "es": "{{0}}Historial de mediciones",
    "de": "{{0}}Messverlauf"
  },
  "{{0}}Изменить период": {
    "en": "{{0}}Edit period",
    "fr": "{{0}}Modifier la période",
    "es": "{{0}}Editar período",
    "de": "{{0}}Zeitraum bearbeiten"
  },
  "{{0}}Удалить период": {
    "en": "{{0}}Delete period",
    "fr": "{{0}}Supprimer la période",
    "es": "{{0}}Eliminar período",
    "de": "{{0}}Zeitraum löschen"
  },
  "Без даты завершения": {
    "en": "No end date",
    "fr": "Sans date de fin",
    "es": "Sin fecha de finalización",
    "de": "Ohne Enddatum"
  },
  "{{0}}Завершить период": {
    "en": "{{0}}End period",
    "fr": "{{0}}Terminer la période",
    "es": "{{0}}Finalizar período",
    "de": "{{0}}Zeitraum beenden"
  },
  "без даты завершения": {
    "en": "no end date",
    "fr": "sans date de fin",
    "es": "sin fecha de finalización",
    "de": "ohne Enddatum"
  },
  "Давление за период": {
    "en": "Blood pressure during the period",
    "fr": "Pression artérielle sur la période",
    "es": "Presión arterial del período",
    "de": "Blutdruck im Zeitraum"
  },
  "Измерения": {
    "en": "Measurements",
    "fr": "Mesures",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "Заметка не добавлена": {
    "en": "No note added",
    "fr": "Aucune note ajoutée",
    "es": "Sin nota",
    "de": "Keine Notiz"
  },
  "Пока нет измерений": {
    "en": "No measurements yet",
    "fr": "Aucune mesure pour le moment",
    "es": "Aún no hay mediciones",
    "de": "Noch keine Messungen"
  },
  "Записи появятся здесь, если их дата попадёт в период.": {
    "en": "Records will appear here when their date falls within the period.",
    "fr": "Les mesures apparaîtront ici si leur date se trouve dans cette période.",
    "es": "Los registros aparecerán aquí si su fecha está dentro del período.",
    "de": "Einträge erscheinen hier, wenn ihr Datum im Zeitraum liegt."
  },
  "Запись не найдена": {
    "en": "Record not found",
    "fr": "Mesure introuvable",
    "es": "Registro no encontrado",
    "de": "Eintrag nicht gefunden"
  },
  "Вернитесь в историю.": {
    "en": "Return to history.",
    "fr": "Revenez à l'historique.",
    "es": "Vuelve al historial.",
    "de": "Kehre zum Verlauf zurück."
  },
  "Дата / время": {
    "en": "Date / time",
    "fr": "Date / heure",
    "es": "Fecha / hora",
    "de": "Datum / Uhrzeit"
  },
  "Давление — мм рт. ст.; пульс — уд/мин.": {
    "en": "Blood pressure — mmHg; pulse — bpm.",
    "fr": "Pression artérielle — mmHg ; pouls — bpm.",
    "es": "Presión arterial — mmHg; pulso — lat/min.",
    "de": "Blutdruck — mmHg; Puls — Schläge/min."
  },
  "Изменить": {
    "en": "Edit",
    "fr": "Modifier",
    "es": "Editar",
    "de": "Bearbeiten"
  },
  "Среднее серии из": {
    "en": "Series average from",
    "fr": "Moyenne de la série de",
    "es": "Media de la serie de",
    "de": "Serienmittelwert aus"
  },
  "Одиночное измерение": {
    "en": "Single measurement",
    "fr": "Mesure unique",
    "es": "Medición individual",
    "de": "Einzelmessung"
  },
  "Добавьте, как вы себя чувствовали или что происходило перед замером.": {
    "en": "Add how you felt or what happened before the reading.",
    "fr": "Indiquez comment vous vous sentiez ou ce qui s'est passé avant le relevé.",
    "es": "Añade cómo te sentías o qué ocurrió antes de medir.",
    "de": "Ergänze, wie du dich gefühlt hast oder was vor der Messung passiert ist."
  },
  "{{0}}, замер {{1}}": {
    "en": "{{0}}, reading {{1}}",
    "fr": "{{0}}, relevé {{1}}",
    "es": "{{0}}, medición {{1}}",
    "de": "{{0}}, Messung {{1}}"
  },
  "Цифровая панель: {{0}}, замер {{1}}": {
    "en": "Numeric keypad: {{0}}, reading {{1}}",
    "fr": "Clavier numérique : {{0}}, relevé {{1}}",
    "es": "Teclado numérico: {{0}}, medición {{1}}",
    "de": "Zifferntastatur: {{0}}, Messung {{1}}"
  },
  "Некорректные показатели. Проверьте:": {
    "en": "Invalid values. Check:",
    "fr": "Valeurs incorrectes. Vérifiez :",
    "es": "Valores no válidos. Comprueba:",
    "de": "Ungültige Werte. Prüfe:"
  },
  "Замер": {
    "en": "Reading",
    "fr": "Relevé",
    "es": "Medición",
    "de": "Messung"
  },
  "Показатели": {
    "en": "Values",
    "fr": "Valeurs",
    "es": "Valores",
    "de": "Messwerte"
  },
  "Удалить замер {{0}}": {
    "en": "Delete reading {{0}}",
    "fr": "Supprimer le relevé {{0}}",
    "es": "Eliminar medición {{0}}",
    "de": "Messung {{0}} löschen"
  },
  "Дата и время замера {{0}}": {
    "en": "Reading date and time {{0}}",
    "fr": "Date et heure du relevé {{0}}",
    "es": "Fecha y hora de la medición {{0}}",
    "de": "Datum und Uhrzeit der Messung {{0}}"
  },
  "Дата и время замера": {
    "en": "Reading date and time",
    "fr": "Date et heure du relevé",
    "es": "Fecha y hora de la medición",
    "de": "Datum und Uhrzeit der Messung"
  },
  "Добавить в серию": {
    "en": "Add to series",
    "fr": "Ajouter à la série",
    "es": "Añadir a la serie",
    "de": "Zur Serie hinzufügen"
  },
  "Добавить замер": {
    "en": "Add reading",
    "fr": "Ajouter un relevé",
    "es": "Añadir medición",
    "de": "Messung hinzufügen"
  },
  "В серии максимум 10 замеров.": {
    "en": "A series can contain up to 10 readings.",
    "fr": "Une série peut contenir jusqu'à 10 relevés.",
    "es": "Una serie puede tener un máximo de 10 mediciones.",
    "de": "Eine Serie kann höchstens 10 Messungen enthalten."
  },
  "Способ измерения": {
    "en": "Measurement mode",
    "fr": "Mode de mesure",
    "es": "Modo de medición",
    "de": "Messmodus"
  },
  "Как вы себя чувствуете?": {
    "en": "How do you feel?",
    "fr": "Comment vous sentez-vous ?",
    "es": "¿Cómo te sientes?",
    "de": "Wie fühlst du dich?"
  },
  "Очень плохо": {
    "en": "Very poor",
    "fr": "Très mal",
    "es": "Muy mal",
    "de": "Sehr schlecht"
  },
  "Отлично": {
    "en": "Excellent",
    "fr": "Excellent",
    "es": "Excelente",
    "de": "Ausgezeichnet"
  },
  "Отметки": {
    "en": "Tags",
    "fr": "Étiquettes",
    "es": "Etiquetas",
    "de": "Markierungen"
  },
  "{{0}}Удалить черновик": {
    "en": "{{0}}Delete draft",
    "fr": "{{0}}Supprimer le brouillon",
    "es": "{{0}}Eliminar borrador",
    "de": "{{0}}Entwurf löschen"
  },
  "Серия": {
    "en": "Series",
    "fr": "Série",
    "es": "Serie",
    "de": "Serie"
  },
  "Серия · 2–10": {
    "en": "Series · 2–10",
    "fr": "Série · 2–10",
    "es": "Serie · 2–10",
    "de": "Serie · 2–10"
  },
  "Хорошо": {
    "en": "Good",
    "fr": "Bien",
    "es": "Bien",
    "de": "Gut"
  },
  "Средне": {
    "en": "Fair",
    "fr": "Moyen",
    "es": "Regular",
    "de": "Mittelmäßig"
  },
  "Плохо": {
    "en": "Poor",
    "fr": "Mal",
    "es": "Mal",
    "de": "Schlecht"
  },
  "· пульс": {
    "en": "· pulse",
    "fr": "· pouls",
    "es": "· pulso",
    "de": "· Puls"
  },
  "Среднее серии": {
    "en": "Series average",
    "fr": "Moyenne de la série",
    "es": "Media de la serie",
    "de": "Serienmittelwert"
  },
  "в": {
    "en": "at",
    "fr": "à",
    "es": "a las",
    "de": "um"
  },
  "Обновлено:": {
    "en": "Updated:",
    "fr": "Mis à jour :",
    "es": "Actualizado:",
    "de": "Aktualisiert:"
  },
  "При следующем открытии приложения": {
    "en": "On the next app opening",
    "fr": "À la prochaine ouverture de l'application",
    "es": "Al abrir la aplicación de nuevo",
    "de": "Beim nächsten Öffnen der App"
  },
  "После первого измерения и следующего открытия": {
    "en": "After the first measurement and the next app opening",
    "fr": "Après la première mesure et la prochaine ouverture",
    "es": "Tras la primera medición y la siguiente apertura",
    "de": "Nach der ersten Messung und dem nächsten Öffnen"
  },
  "Резервная копия": {
    "en": "Backup",
    "fr": "Sauvegarde",
    "es": "Copia de seguridad",
    "de": "Sicherung"
  },
  "Автоматическая копия": {
    "en": "Automatic backup",
    "fr": "Sauvegarde automatique",
    "es": "Copia automática",
    "de": "Automatische Sicherung"
  },
  "При запуске 1 раз в 24 часа": {
    "en": "On opening, once every 24 hours",
    "fr": "À l'ouverture, une fois toutes les 24 heures",
    "es": "Al abrir, una vez cada 24 horas",
    "de": "Beim Öffnen, einmal alle 24 Stunden"
  },
  "Папка сохранения": {
    "en": "Backup folder",
    "fr": "Dossier de sauvegarde",
    "es": "Carpeta de guardado",
    "de": "Speicherordner"
  },
  "В хранилище": {
    "en": "In storage",
    "fr": "Dans le stockage",
    "es": "En el almacenamiento",
    "de": "Im Speicher"
  },
  "Сохранённая копия": {
    "en": "Saved backup",
    "fr": "Sauvegarde enregistrée",
    "es": "Copia guardada",
    "de": "Gespeicherte Sicherung"
  },
  "Экспорт и восстановление": {
    "en": "Export and restore",
    "fr": "Export et restauration",
    "es": "Exportar y restaurar",
    "de": "Export und Wiederherstellung"
  },
  "Экспорт Excel": {
    "en": "Export Excel",
    "fr": "Exporter vers Excel",
    "es": "Exportar Excel",
    "de": "Excel exportieren"
  },
  "Измерения, замеры и периоды · .xlsx": {
    "en": "Measurements, readings and periods · .xlsx",
    "fr": "Mesures, relevés et périodes · .xlsx",
    "es": "Mediciones, lecturas y períodos · .xlsx",
    "de": "Messungen, Einzelwerte und Zeiträume · .xlsx"
  },
  "Импортировать копию": {
    "en": "Import backup",
    "fr": "Importer une sauvegarde",
    "es": "Importar copia",
    "de": "Sicherung importieren"
  },
  "Выбрать JSON-файл на устройстве": {
    "en": "Choose a JSON file on your device",
    "fr": "Choisir un fichier JSON sur l'appareil",
    "es": "Elegir un archivo JSON del dispositivo",
    "de": "JSON-Datei auf dem Gerät wählen"
  },
  "Дневник": {
    "en": "Diary",
    "fr": "Journal",
    "es": "Diario",
    "de": "Tagebuch"
  },
  "Сброс": {
    "en": "Reset",
    "fr": "Réinitialisation",
    "es": "Restablecer",
    "de": "Zurücksetzen"
  },
  "Удаление всей информации в приложении": {
    "en": "Delete all information in the app",
    "fr": "Suppression de toutes les données de l'application",
    "es": "Eliminar toda la información de la aplicación",
    "de": "Alle Informationen in der App löschen"
  },
  "Удалить все измерения": {
    "en": "Delete all measurements",
    "fr": "Supprimer toutes les mesures",
    "es": "Eliminar todas las mediciones",
    "de": "Alle Messungen löschen"
  },
  "Периоды и резервная копия останутся.": {
    "en": "Periods and the backup will remain.",
    "fr": "Les périodes et la sauvegarde seront conservées.",
    "es": "Se conservarán los períodos y la copia de seguridad.",
    "de": "Zeiträume und Sicherung bleiben erhalten."
  },
  "Сброс к заводским настройкам": {
    "en": "Factory reset",
    "fr": "Réinitialisation complète",
    "es": "Restablecer ajustes de fábrica",
    "de": "Auf Werkseinstellungen zurücksetzen"
  },
  "Все данные, периоды и резервная копия": {
    "en": "All data, periods and the backup",
    "fr": "Toutes les données, périodes et sauvegarde",
    "es": "Todos los datos, períodos y la copia de seguridad",
    "de": "Alle Daten, Zeiträume und die Sicherung"
  },
  "История": {
    "en": "History",
    "fr": "Historique",
    "es": "Historial",
    "de": "Verlauf"
  },
  "Статистика": {
    "en": "Statistics",
    "fr": "Statistiques",
    "es": "Estadísticas",
    "de": "Statistik"
  },
  "Настройки": {
    "en": "Settings",
    "fr": "Réglages",
    "es": "Ajustes",
    "de": "Einstellungen"
  },
  "Завершённый период": {
    "en": "Completed period",
    "fr": "Période terminée",
    "es": "Período finalizado",
    "de": "Abgeschlossener Zeitraum"
  },
  "Активный период": {
    "en": "Active period",
    "fr": "Période active",
    "es": "Período activo",
    "de": "Aktiver Zeitraum"
  },
  "Фильтры истории": {
    "en": "History filters",
    "fr": "Filtres de l'historique",
    "es": "Filtros del historial",
    "de": "Verlaufsfilter"
  },
  "Добавить измерение": {
    "en": "Add measurement",
    "fr": "Ajouter une mesure",
    "es": "Añadir medición",
    "de": "Messung hinzufügen"
  },
  "Выбрано фильтров: {{0}}": {
    "en": "Selected filters: {{0}}",
    "fr": "Filtres sélectionnés : {{0}}",
    "es": "Filtros seleccionados: {{0}}",
    "de": "Ausgewählte Filter: {{0}}"
  },
  "Назад к статистике": {
    "en": "Back to statistics",
    "fr": "Retour aux statistiques",
    "es": "Volver a estadísticas",
    "de": "Zurück zur Statistik"
  },
  "Сравнение": {
    "en": "Comparison",
    "fr": "Comparaison",
    "es": "Comparación",
    "de": "Vergleich"
  },
  "Назад": {
    "en": "Back",
    "fr": "Retour",
    "es": "Atrás",
    "de": "Zurück"
  },
  "Главная": {
    "en": "Home",
    "fr": "Accueil",
    "es": "Inicio",
    "de": "Start"
  },
  "Сохранить": {
    "en": "Save",
    "fr": "Enregistrer",
    "es": "Guardar",
    "de": "Speichern"
  },
  "серию": {
    "en": "the series",
    "fr": "la série",
    "es": "la serie",
    "de": "die Serie"
  },
  "измерение": {
    "en": "the measurement",
    "fr": "la mesure",
    "es": "la medición",
    "de": "die Messung"
  },
  "Нажмите на точку, чтобы открыть измерения.": {
    "en": "Tap a point to open its measurements.",
    "fr": "Touchez un point pour ouvrir ses mesures.",
    "es": "Toca un punto para abrir sus mediciones.",
    "de": "Tippe auf einen Punkt, um die Messungen zu öffnen."
  },
  "Нажмите на точку или откройте таблицу.": {
    "en": "Tap a point or open the table.",
    "fr": "Touchez un point ou ouvrez le tableau.",
    "es": "Toca un punto o abre la tabla.",
    "de": "Tippe auf einen Punkt oder öffne die Tabelle."
  },
  "баллы": {
    "en": "points",
    "fr": "points",
    "es": "puntos",
    "de": "Punkte"
  },
  "Открыть исходные записи": {
    "en": "Open original records",
    "fr": "Ouvrir les mesures d'origine",
    "es": "Abrir registros originales",
    "de": "Ursprüngliche Einträge öffnen"
  },
  "Открыть измерение": {
    "en": "Open measurement",
    "fr": "Ouvrir la mesure",
    "es": "Abrir medición",
    "de": "Messung öffnen"
  },
  "Закрыть окно": {
    "en": "Close dialog",
    "fr": "Fermer la fenêtre",
    "es": "Cerrar ventana",
    "de": "Dialog schließen"
  },
  "Подтвердить": {
    "en": "Confirm",
    "fr": "Confirmer",
    "es": "Confirmar",
    "de": "Bestätigen"
  },
  "Предыдущий месяц": {
    "en": "Previous month",
    "fr": "Mois précédent",
    "es": "Mes anterior",
    "de": "Vorheriger Monat"
  },
  "Следующий месяц": {
    "en": "Next month",
    "fr": "Mois suivant",
    "es": "Mes siguiente",
    "de": "Nächster Monat"
  },
  "Пн": {
    "en": "Mon",
    "fr": "Lun",
    "es": "Lun",
    "de": "Mo"
  },
  "Вт": {
    "en": "Tue",
    "fr": "Mar",
    "es": "Mar",
    "de": "Di"
  },
  "Ср": {
    "en": "Wed",
    "fr": "Mer",
    "es": "Mié",
    "de": "Mi"
  },
  "Чт": {
    "en": "Thu",
    "fr": "Jeu",
    "es": "Jue",
    "de": "Do"
  },
  "Пт": {
    "en": "Fri",
    "fr": "Ven",
    "es": "Vie",
    "de": "Fr"
  },
  "Сб": {
    "en": "Sat",
    "fr": "Sam",
    "es": "Sáb",
    "de": "Sa"
  },
  "Вс": {
    "en": "Sun",
    "fr": "Dim",
    "es": "Dom",
    "de": "So"
  },
  "часов": {
    "en": "hours",
    "fr": "heures",
    "es": "horas",
    "de": "Stunden"
  },
  "минут": {
    "en": "minutes",
    "fr": "minutes",
    "es": "minutos",
    "de": "Minuten"
  },
  "Время замера": {
    "en": "Reading time",
    "fr": "Heure du relevé",
    "es": "Hora de medición",
    "de": "Messzeit"
  },
  "Часы": {
    "en": "Hours",
    "fr": "Heures",
    "es": "Horas",
    "de": "Stunden"
  },
  "Минуты": {
    "en": "Minutes",
    "fr": "Minutes",
    "es": "Minutos",
    "de": "Minuten"
  },
  "Порядок записей": {
    "en": "Record order",
    "fr": "Ordre des mesures",
    "es": "Orden de registros",
    "de": "Reihenfolge der Einträge"
  },
  "С какой даты": {
    "en": "Start date",
    "fr": "Date de début",
    "es": "Fecha de inicio",
    "de": "Anfangsdatum"
  },
  "По какую дату": {
    "en": "End date",
    "fr": "Date de fin",
    "es": "Fecha de finalización",
    "de": "Enddatum"
  },
  "Обе даты входят в выбранный интервал.": {
    "en": "Both dates are included in the range.",
    "fr": "Les deux dates sont incluses dans l'intervalle.",
    "es": "Ambas fechas se incluyen en el intervalo.",
    "de": "Beide Daten gehören zum ausgewählten Bereich."
  },
  "Фильтры": {
    "en": "Filters",
    "fr": "Filtres",
    "es": "Filtros",
    "de": "Filter"
  },
  "Дата измерения": {
    "en": "Measurement date",
    "fr": "Date de la mesure",
    "es": "Fecha de medición",
    "de": "Messdatum"
  },
  "Быстрый выбор дат": {
    "en": "Quick date selection",
    "fr": "Sélection rapide des dates",
    "es": "Selección rápida de fechas",
    "de": "Schnelle Datumsauswahl"
  },
  "Тип записи": {
    "en": "Record type",
    "fr": "Type de mesure",
    "es": "Tipo de registro",
    "de": "Eintragsart"
  },
  "Период наблюдения": {
    "en": "Observation period",
    "fr": "Période de suivi",
    "es": "Período de seguimiento",
    "de": "Beobachtungszeitraum"
  },
  "Самочувствие и отметки": {
    "en": "Wellbeing and tags",
    "fr": "Bien-être et étiquettes",
    "es": "Bienestar y etiquetas",
    "de": "Wohlbefinden und Markierungen"
  },
  "От": {
    "en": "From",
    "fr": "De",
    "es": "Desde",
    "de": "Von"
  },
  "Самочувствие от": {
    "en": "Wellbeing from",
    "fr": "Bien-être à partir de",
    "es": "Bienestar desde",
    "de": "Wohlbefinden ab"
  },
  "До": {
    "en": "To",
    "fr": "À",
    "es": "Hasta",
    "de": "Bis"
  },
  "Самочувствие до": {
    "en": "Wellbeing up to",
    "fr": "Bien-être jusqu'à",
    "es": "Bienestar hasta",
    "de": "Wohlbefinden bis"
  },
  "Некорректное самочувствие. Проверьте:": {
    "en": "Invalid wellbeing. Check:",
    "fr": "Score de bien-être incorrect. Vérifiez :",
    "es": "Bienestar no válido. Comprueba:",
    "de": "Ungültiges Wohlbefinden. Prüfe:"
  },
  "Подойдёт любая из выбранных отметок.": {
    "en": "Any selected tag will match.",
    "fr": "Une seule des étiquettes sélectionnées suffit.",
    "es": "Coincidirá cualquier etiqueta seleccionada.",
    "de": "Jede ausgewählte Markierung zählt als Treffer."
  },
  "Отметки измерения": {
    "en": "Measurement tags",
    "fr": "Étiquettes de la mesure",
    "es": "Etiquetas de medición",
    "de": "Messungsmarkierungen"
  },
  "{{0}}Только с заметкой": {
    "en": "{{0}}Only with a note",
    "fr": "{{0}}Uniquement avec une note",
    "es": "{{0}}Solo con nota",
    "de": "{{0}}Nur mit Notiz"
  },
  "Направление сортировки": {
    "en": "Sort direction",
    "fr": "Sens du tri",
    "es": "Dirección de ordenación",
    "de": "Sortierrichtung"
  },
  "Все": {
    "en": "All",
    "fr": "Toutes",
    "es": "Todos",
    "de": "Alle"
  },
  "Дата начала": {
    "en": "Start date",
    "fr": "Date de début",
    "es": "Fecha de inicio",
    "de": "Anfangsdatum"
  },
  "Дата окончания": {
    "en": "End date",
    "fr": "Date de fin",
    "es": "Fecha de finalización",
    "de": "Enddatum"
  },
  "По дате": {
    "en": "By date",
    "fr": "Par date",
    "es": "Por fecha",
    "de": "Nach Datum"
  },
  "По верхнему давлению": {
    "en": "By systolic pressure",
    "fr": "Par pression systolique",
    "es": "Por presión sistólica",
    "de": "Nach systolischem Blutdruck"
  },
  "По нижнему давлению": {
    "en": "By diastolic pressure",
    "fr": "Par pression diastolique",
    "es": "Por presión diastólica",
    "de": "Nach diastolischem Blutdruck"
  },
  "По пульсу": {
    "en": "By pulse",
    "fr": "Par pouls",
    "es": "Por pulso",
    "de": "Nach Puls"
  },
  "Все периоды": {
    "en": "All periods",
    "fr": "Toutes les périodes",
    "es": "Todos los períodos",
    "de": "Alle Zeiträume"
  },
  "Закрыть календарь": {
    "en": "Close calendar",
    "fr": "Fermer le calendrier",
    "es": "Cerrar calendario",
    "de": "Kalender schließen"
  },
  "Сбросить дату": {
    "en": "Clear date",
    "fr": "Effacer la date",
    "es": "Borrar fecha",
    "de": "Datum löschen"
  },
  "Дата начала должна быть не позже даты окончания.": {
    "en": "The start date must not be after the end date.",
    "fr": "La date de début ne doit pas être postérieure à la date de fin.",
    "es": "La fecha de inicio no debe ser posterior a la fecha de finalización.",
    "de": "Das Anfangsdatum darf nicht nach dem Enddatum liegen."
  },
  "Укажите оценку от 1 до 10.": {
    "en": "Enter a score from 1 to 10.",
    "fr": "Saisissez un score de 1 à 10.",
    "es": "Introduce una puntuación de 1 a 10.",
    "de": "Gib eine Bewertung von 1 bis 10 ein."
  },
  "Начальная оценка должна быть не больше конечной.": {
    "en": "The starting score must not exceed the ending score.",
    "fr": "Le score de début ne doit pas dépasser le score de fin.",
    "es": "La puntuación inicial no debe superar la final.",
    "de": "Die Anfangsbewertung darf die Endbewertung nicht überschreiten."
  },
  "Проверьте даты": {
    "en": "Check dates",
    "fr": "Vérifier les dates",
    "es": "Comprueba las fechas",
    "de": "Daten prüfen"
  },
  "Проверьте оценку": {
    "en": "Check the score",
    "fr": "Vérifier le score",
    "es": "Comprueba la puntuación",
    "de": "Bewertung prüfen"
  },
  "Показать": {
    "en": "Show",
    "fr": "Afficher",
    "es": "Mostrar",
    "de": "Anzeigen"
  },
  "Выбрать": {
    "en": "Choose",
    "fr": "Choisir",
    "es": "Elegir",
    "de": "Wählen"
  },
  "Сначала большие": {
    "en": "Highest first",
    "fr": "Les plus élevées",
    "es": "Más altos primero",
    "de": "Höchste zuerst"
  },
  "Сначала меньшие": {
    "en": "Lowest first",
    "fr": "Les plus basses",
    "es": "Más bajos primero",
    "de": "Niedrigste zuerst"
  },
  "Дата и время начала": {
    "en": "Start date and time",
    "fr": "Date et heure de début",
    "es": "Fecha y hora de inicio",
    "de": "Datum und Uhrzeit des Beginns"
  },
  "Дата и время завершения": {
    "en": "End date and time",
    "fr": "Date et heure de fin",
    "es": "Fecha y hora de finalización",
    "de": "Datum und Uhrzeit des Endes"
  },
  "Изменить период": {
    "en": "Edit period",
    "fr": "Modifier la période",
    "es": "Editar período",
    "de": "Zeitraum bearbeiten"
  },
  "Название": {
    "en": "Name",
    "fr": "Nom",
    "es": "Nombre",
    "de": "Name"
  },
  "Название периода": {
    "en": "Period name",
    "fr": "Nom de la période",
    "es": "Nombre del período",
    "de": "Name des Zeitraums"
  },
  "Значок": {
    "en": "Icon",
    "fr": "Icône",
    "es": "Icono",
    "de": "Symbol"
  },
  "Цвет": {
    "en": "Colour",
    "fr": "Couleur",
    "es": "Color",
    "de": "Farbe"
  },
  "Цвет {{0}}": {
    "en": "Colour {{0}}",
    "fr": "Couleur {{0}}",
    "es": "Color {{0}}",
    "de": "Farbe {{0}}"
  },
  "\">Удалить период": {
    "en": "\">Delete period",
    "fr": "\">Supprimer la période",
    "es": "\">Eliminar período",
    "de": "\">Zeitraum löschen"
  },
  "Создать период": {
    "en": "Create period",
    "fr": "Créer une période",
    "es": "Crear período",
    "de": "Zeitraum erstellen"
  },
  "Время начала": {
    "en": "Start time",
    "fr": "Heure de début",
    "es": "Hora de inicio",
    "de": "Anfangszeit"
  },
  "Время завершения": {
    "en": "End time",
    "fr": "Heure de fin",
    "es": "Hora de finalización",
    "de": "Endzeit"
  },
  "Лимит одновременных периодов": {
    "en": "Concurrent period limit",
    "fr": "Limite de périodes simultanées",
    "es": "Límite de períodos simultáneos",
    "de": "Grenze gleichzeitiger Zeiträume"
  },
  "Проверьте даты периода": {
    "en": "Check the period dates",
    "fr": "Vérifier les dates de la période",
    "es": "Comprueba las fechas del período",
    "de": "Zeitraumdaten prüfen"
  },
  "Укажите корректные дату и время.": {
    "en": "Enter a valid date and time.",
    "fr": "Saisissez une date et une heure valides.",
    "es": "Introduce una fecha y hora válidas.",
    "de": "Gib ein gültiges Datum und eine gültige Uhrzeit ein."
  },
  "Проверьте даты периода.": {
    "en": "Check the period dates.",
    "fr": "Vérifiez les dates de la période.",
    "es": "Comprueba las fechas del período.",
    "de": "Prüfe die Daten des Zeitraums."
  },
  "60–260 мм рт. ст.": {
    "en": "60–260 mmHg",
    "fr": "60–260 mmHg",
    "es": "60–260 mmHg",
    "de": "60–260 mmHg"
  },
  "35–160 мм рт. ст.": {
    "en": "35–160 mmHg",
    "fr": "35–160 mmHg",
    "es": "35–160 mmHg",
    "de": "35–160 mmHg"
  },
  "30–220 уд/мин": {
    "en": "30–220 bpm",
    "fr": "30–220 bpm",
    "es": "30–220 lat/min",
    "de": "30–220 Schläge/min"
  },
  "aria-label=\"Стереть цифру\"": {
    "en": "aria-label=\"Delete digit\"",
    "fr": "aria-label=\"Effacer le chiffre\"",
    "es": "aria-label=\"Borrar dígito\"",
    "de": "aria-label=\"Ziffer löschen\""
  },
  "Очистить": {
    "en": "Clear",
    "fr": "Effacer",
    "es": "Borrar",
    "de": "Leeren"
  },
  "Укажите дату и время каждого замера.": {
    "en": "Enter the date and time for each reading.",
    "fr": "Saisissez la date et l'heure de chaque relevé.",
    "es": "Introduce la fecha y hora de cada medición.",
    "de": "Gib Datum und Uhrzeit für jede Messung ein."
  },
  "Нет данных для экспорта": {
    "en": "No data to export",
    "fr": "Aucune donnée à exporter",
    "es": "No hay datos para exportar",
    "de": "Keine Daten zum Exportieren"
  },
  "Сначала сохраните хотя бы одно измерение.": {
    "en": "Save at least one measurement first.",
    "fr": "Enregistrez d'abord au moins une mesure.",
    "es": "Guarda al menos una medición primero.",
    "de": "Speichere zuerst mindestens eine Messung."
  },
  "Библиотека Excel не загрузилась.": {
    "en": "The Excel library could not be loaded.",
    "fr": "La bibliothèque Excel n'a pas pu être chargée.",
    "es": "No se pudo cargar la biblioteca de Excel.",
    "de": "Die Excel-Bibliothek konnte nicht geladen werden."
  },
  "Верхнее, мм рт. ст.": {
    "en": "Systolic, mmHg",
    "fr": "Systolique, mmHg",
    "es": "Sistólica, mmHg",
    "de": "Systolisch, mmHg"
  },
  "Нижнее, мм рт. ст.": {
    "en": "Diastolic, mmHg",
    "fr": "Diastolique, mmHg",
    "es": "Diastólica, mmHg",
    "de": "Diastolisch, mmHg"
  },
  "Пульс, уд/мин": {
    "en": "Pulse, bpm",
    "fr": "Pouls, bpm",
    "es": "Pulso, lat/min",
    "de": "Puls, Schläge/min"
  },
  "Самочувствие, 1–10": {
    "en": "Wellbeing, 1–10",
    "fr": "Bien-être, 1–10",
    "es": "Bienestar, 1–10",
    "de": "Wohlbefinden, 1–10"
  },
  "Тип": {
    "en": "Type",
    "fr": "Type",
    "es": "Tipo",
    "de": "Typ"
  },
  "Замеров": {
    "en": "Readings",
    "fr": "Relevés",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "Замеры": {
    "en": "Readings",
    "fr": "Relevés",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "Номер записи": {
    "en": "Record number",
    "fr": "Numéro de mesure",
    "es": "Número de registro",
    "de": "Eintragsnummer"
  },
  "Конец": {
    "en": "End",
    "fr": "Fin",
    "es": "Fin",
    "de": "Ende"
  },
  "Записей": {
    "en": "Records",
    "fr": "Mesures",
    "es": "Registros",
    "de": "Einträge"
  },
  "Экспорт не выполнен": {
    "en": "Export failed",
    "fr": "Échec de l'export",
    "es": "Error al exportar",
    "de": "Export fehlgeschlagen"
  },
  "Закрыть": {
    "en": "Close",
    "fr": "Fermer",
    "es": "Cerrar",
    "de": "Schließen"
  },
  "Обновлено": {
    "en": "Updated",
    "fr": "Mise à jour",
    "es": "Actualizado",
    "de": "Aktualisiert"
  },
  "Исходных замеров": {
    "en": "Original readings",
    "fr": "Relevés d'origine",
    "es": "Mediciones originales",
    "de": "Ursprüngliche Messungen"
  },
  "Серий": {
    "en": "Series",
    "fr": "Séries",
    "es": "Series",
    "de": "Serien"
  },
  "Дней с измерениями": {
    "en": "Days with measurements",
    "fr": "Jours avec des mesures",
    "es": "Días con mediciones",
    "de": "Tage mit Messungen"
  },
  "Периодов": {
    "en": "Periods",
    "fr": "Périodes",
    "es": "Períodos",
    "de": "Zeiträume"
  },
  "Копии пока нет": {
    "en": "No backup yet",
    "fr": "Aucune sauvegarde pour le moment",
    "es": "Aún no hay copia de seguridad",
    "de": "Noch keine Sicherung"
  },
  "Она появится при открытии приложения с сохранёнными измерениями.": {
    "en": "It will be created when you open the app with saved measurements.",
    "fr": "Elle sera créée à l'ouverture de l'application avec des mesures enregistrées.",
    "es": "Se creará al abrir la aplicación con mediciones guardadas.",
    "de": "Sie wird beim Öffnen der App mit gespeicherten Messungen erstellt."
  },
  "Включите автоматическую копию. Она будет создана при следующем открытии приложения.": {
    "en": "Enable automatic backup. It will be created the next time you open the app.",
    "fr": "Activez la sauvegarde automatique. Elle sera créée à la prochaine ouverture de l'application.",
    "es": "Activa la copia automática. Se creará la próxima vez que abras la aplicación.",
    "de": "Aktiviere die automatische Sicherung. Sie wird beim nächsten Öffnen der App erstellt."
  },
  "Сначала восстановите доступ к сохранённому дневнику.": {
    "en": "Restore access to the saved diary first.",
    "fr": "Rétablissez d'abord l'accès au journal enregistré.",
    "es": "Primero restablece el acceso al diario guardado.",
    "de": "Stelle zuerst den Zugriff auf das gespeicherte Tagebuch wieder her."
  },
  "Не удалось открыть папку:": {
    "en": "Could not open the folder:",
    "fr": "Impossible d'ouvrir le dossier :",
    "es": "No se pudo abrir la carpeta:",
    "de": "Ordner konnte nicht geöffnet werden:"
  },
  "Сброс не выполнен": {
    "en": "Reset failed",
    "fr": "Échec de la réinitialisation",
    "es": "No se pudo restablecer",
    "de": "Zurücksetzen fehlgeschlagen"
  },
  "Не удалось сохранить файл копии:": {
    "en": "Could not save the backup file:",
    "fr": "Impossible d'enregistrer le fichier de sauvegarde :",
    "es": "No se pudo guardar el archivo de copia:",
    "de": "Sicherungsdatei konnte nicht gespeichert werden:"
  },
  "Восстановить дневник?": {
    "en": "Restore the diary?",
    "fr": "Restaurer le journal ?",
    "es": "¿Restaurar el diario?",
    "de": "Tagebuch wiederherstellen?"
  },
  "В копии:": {
    "en": "In the backup:",
    "fr": "Dans la sauvegarde :",
    "es": "En la copia:",
    "de": "In der Sicherung:"
  },
  ", периодов:": {
    "en": ", periods:",
    "fr": ", périodes :",
    "es": ", períodos:",
    "de": ", Zeiträume:"
  },
  "Записи в этом варианте заменятся данными из копии. Это действие нельзя отменить.": {
    "en": "Records in this design will be replaced by the backup. This cannot be undone.",
    "fr": "Les mesures de cette variante seront remplacées par la sauvegarde. Cette action est irréversible.",
    "es": "Los registros de este diseño se sustituirán por los de la copia. Esta acción no se puede deshacer.",
    "de": "Einträge in diesem Design werden durch die Sicherung ersetzt. Dies kann nicht rückgängig gemacht werden."
  },
  "Восстановить": {
    "en": "Restore",
    "fr": "Restaurer",
    "es": "Restaurar",
    "de": "Wiederherstellen"
  },
  "Не удалось восстановить копию": {
    "en": "Could not restore the backup",
    "fr": "Impossible de restaurer la sauvegarde",
    "es": "No se pudo restaurar la copia",
    "de": "Sicherung konnte nicht wiederhergestellt werden"
  },
  "Ваши текущие записи сохранены.": {
    "en": "Your current records have been preserved.",
    "fr": "Vos mesures actuelles ont été conservées.",
    "es": "Tus registros actuales se han conservado.",
    "de": "Deine aktuellen Einträge wurden erhalten."
  },
  "Понятно": {
    "en": "OK",
    "fr": "Compris",
    "es": "Entendido",
    "de": "OK"
  },
  "Не удалось прочитать": {
    "en": "Could not read the file",
    "fr": "Impossible de lire le fichier",
    "es": "No se pudo leer",
    "de": "Datei konnte nicht gelesen werden"
  },
  "Выберите резервную копию JSON приложения «Давление».": {
    "en": "Choose a JSON backup from the Pressure Diary app.",
    "fr": "Choisissez une sauvegarde JSON de l'application de pression artérielle.",
    "es": "Elige una copia JSON de la aplicación Presión arterial.",
    "de": "Wähle eine JSON-Sicherung aus der Blutdruck-App."
  },
  "Не удалось сохранить заметку:": {
    "en": "Could not save the note:",
    "fr": "Impossible d'enregistrer la note :",
    "es": "No se pudo guardar la nota:",
    "de": "Notiz konnte nicht gespeichert werden:"
  },
  "Дата начала должна быть раньше даты окончания или совпадать с ней.": {
    "en": "The start date must be before or equal to the end date.",
    "fr": "La date de début doit précéder ou être identique à la date de fin.",
    "es": "La fecha de inicio debe ser anterior o igual a la fecha de finalización.",
    "de": "Das Anfangsdatum muss vor oder auf dem Enddatum liegen."
  },
  "Значения графика": {
    "en": "Chart values",
    "fr": "Valeurs du graphique",
    "es": "Valores del gráfico",
    "de": "Diagrammwerte"
  },
  "{{0}} · {{1}}. Здесь показаны все измерения.": {
    "en": "{{0}} · {{1}}. All measurements are shown here.",
    "fr": "{{0}} · {{1}}. Toutes les mesures sont affichées ici.",
    "es": "{{0}} · {{1}}. Aquí se muestran todas las mediciones.",
    "de": "{{0}} · {{1}}. Hier werden alle Messungen angezeigt."
  },
  "Нет данных": {
    "en": "No data",
    "fr": "Aucune donnée",
    "es": "Sin datos",
    "de": "Keine Daten"
  },
  "Выберите другой интервал.": {
    "en": "Choose another range.",
    "fr": "Choisissez un autre intervalle.",
    "es": "Elige otro intervalo.",
    "de": "Wähle einen anderen Zeitraum."
  },
  "Исходные записи": {
    "en": "Original records",
    "fr": "Mesures d'origine",
    "es": "Registros originales",
    "de": "Ursprüngliche Einträge"
  },
  "Удалить черновик": {
    "en": "Delete draft",
    "fr": "Supprimer le brouillon",
    "es": "Eliminar borrador",
    "de": "Entwurf löschen"
  },
  "При удалении черновика все введенные в нем данные также удалятся.": {
    "en": "Deleting the draft will also delete all data entered in it.",
    "fr": "La suppression du brouillon effacera aussi toutes les données qu'il contient.",
    "es": "Al eliminar el borrador también se eliminarán todos los datos introducidos en él.",
    "de": "Beim Löschen des Entwurfs werden auch alle darin eingegebenen Daten gelöscht."
  },
  "Заметка к измерению": {
    "en": "Measurement note",
    "fr": "Note de la mesure",
    "es": "Nota de la medición",
    "de": "Messungsnotiz"
  },
  "Текст заметки": {
    "en": "Note text",
    "fr": "Texte de la note",
    "es": "Texto de la nota",
    "de": "Notiztext"
  },
  "Не удалось завершить период": {
    "en": "Could not end the period",
    "fr": "Impossible de terminer la période",
    "es": "No se pudo finalizar el período",
    "de": "Zeitraum konnte nicht beendet werden"
  },
  "Удалить период?": {
    "en": "Delete the period?",
    "fr": "Supprimer la période ?",
    "es": "¿Eliminar el período?",
    "de": "Zeitraum löschen?"
  },
  "Измерения останутся в дневнике. Удаление периода нельзя отменить.": {
    "en": "Measurements will remain in the diary. Deleting a period cannot be undone.",
    "fr": "Les mesures resteront dans le journal. La suppression d'une période est irréversible.",
    "es": "Las mediciones permanecerán en el diario. Eliminar un período no se puede deshacer.",
    "de": "Messungen bleiben im Tagebuch. Das Löschen eines Zeitraums kann nicht rückgängig gemacht werden."
  },
  "Удалить": {
    "en": "Delete",
    "fr": "Supprimer",
    "es": "Eliminar",
    "de": "Löschen"
  },
  "Удалить все измерения?": {
    "en": "Delete all measurements?",
    "fr": "Supprimer toutes les mesures ?",
    "es": "¿Eliminar todas las mediciones?",
    "de": "Alle Messungen löschen?"
  },
  "{{0}} будут удалены из этого варианта. Периоды и резервная копия сохранятся. Действие нельзя отменить.": {
    "en": "{{0}} will be deleted from this design. Periods and the backup will remain. This cannot be undone.",
    "fr": "{{0}} seront supprimées de cette variante. Les périodes et la sauvegarde seront conservées. Cette action est irréversible.",
    "es": "Se eliminarán {{0}} de este diseño. Se conservarán los períodos y la copia de seguridad. Esta acción no se puede deshacer.",
    "de": "{{0}} werden aus diesem Design gelöscht. Zeiträume und Sicherung bleiben erhalten. Dies kann nicht rückgängig gemacht werden."
  },
  "Сбросить дневник?": {
    "en": "Reset the diary?",
    "fr": "Réinitialiser le journal ?",
    "es": "¿Restablecer el diario?",
    "de": "Tagebuch zurücksetzen?"
  },
  "Все измерения, периоды, черновики и сохранённая резервная копия будут удалены. Настройки вернутся к исходным значениям. Это действие нельзя отменить.": {
    "en": "All measurements, periods, drafts and the saved backup will be deleted. Settings will return to defaults. This cannot be undone.",
    "fr": "Toutes les mesures, périodes, brouillons et la sauvegarde seront supprimés. Les réglages retrouveront leurs valeurs initiales. Cette action est irréversible.",
    "es": "Se eliminarán todas las mediciones, períodos, borradores y la copia guardada. Los ajustes volverán a sus valores iniciales. Esta acción no se puede deshacer.",
    "de": "Alle Messungen, Zeiträume, Entwürfe und die gespeicherte Sicherung werden gelöscht. Die Einstellungen werden zurückgesetzt. Dies kann nicht rückgängig gemacht werden."
  },
  "Сбросить всё": {
    "en": "Reset everything",
    "fr": "Tout réinitialiser",
    "es": "Restablecer todo",
    "de": "Alles zurücksetzen"
  },
  "Нормально": {
    "en": "Normal",
    "fr": "Normal",
    "es": "Normal",
    "de": "Normal"
  },
  "Спокойно": {
    "en": "Calm",
    "fr": "Calme",
    "es": "Tranquilo",
    "de": "Ruhig"
  },
  "Бодрость": {
    "en": "Energetic",
    "fr": "Énergique",
    "es": "Energía",
    "de": "Energie"
  },
  "Усталость": {
    "en": "Tiredness",
    "fr": "Fatigue",
    "es": "Cansancio",
    "de": "Müdigkeit"
  },
  "Слабость": {
    "en": "Weakness",
    "fr": "Faiblesse",
    "es": "Debilidad",
    "de": "Schwäche"
  },
  "Сонливость": {
    "en": "Drowsiness",
    "fr": "Somnolence",
    "es": "Somnolencia",
    "de": "Schläfrigkeit"
  },
  "Головная боль": {
    "en": "Headache",
    "fr": "Mal de tête",
    "es": "Dolor de cabeza",
    "de": "Kopfschmerzen"
  },
  "Головокружение": {
    "en": "Dizziness",
    "fr": "Vertiges",
    "es": "Mareo",
    "de": "Schwindel"
  },
  "Тошнота": {
    "en": "Nausea",
    "fr": "Nausées",
    "es": "Náuseas",
    "de": "Übelkeit"
  },
  "Одышка": {
    "en": "Shortness of breath",
    "fr": "Essoufflement",
    "es": "Falta de aire",
    "de": "Atemnot"
  },
  "Сердцебиение": {
    "en": "Palpitations",
    "fr": "Palpitations",
    "es": "Palpitaciones",
    "de": "Herzklopfen"
  },
  "Боль в груди": {
    "en": "Chest pain",
    "fr": "Douleur thoracique",
    "es": "Dolor en el pecho",
    "de": "Brustschmerzen"
  },
  "Стресс": {
    "en": "Stress",
    "fr": "Stress",
    "es": "Estrés",
    "de": "Stress"
  },
  "После кофе": {
    "en": "After coffee",
    "fr": "Après le café",
    "es": "Después del café",
    "de": "Nach Kaffee"
  },
  "После лекарства": {
    "en": "After medication",
    "fr": "Après un médicament",
    "es": "Después de medicación",
    "de": "Nach Medikamenten"
  },
  "После нагрузки": {
    "en": "After exercise",
    "fr": "Après un effort",
    "es": "Después de ejercicio",
    "de": "Nach Sport"
  },
  "Без напитков": {
    "en": "No drinks",
    "fr": "Sans boissons",
    "es": "Sin bebidas",
    "de": "Ohne Getränke"
  },
  "Кофе": {
    "en": "Coffee",
    "fr": "Café",
    "es": "Café",
    "de": "Kaffee"
  },
  "Энергетик": {
    "en": "Energy drink",
    "fr": "Boisson énergisante",
    "es": "Bebida energética",
    "de": "Energydrink"
  },
  "Алкоголь": {
    "en": "Alcohol",
    "fr": "Alcool",
    "es": "Alcohol",
    "de": "Alkohol"
  },
  "Всё вместе": {
    "en": "Combined",
    "fr": "Tout ensemble",
    "es": "Combinado",
    "de": "Alles zusammen"
  },
  "Лист": {
    "en": "Leaf",
    "fr": "Feuille",
    "es": "Hoja",
    "de": "Blatt"
  },
  "Энергия": {
    "en": "Energy",
    "fr": "Énergie",
    "es": "Energía",
    "de": "Energie"
  },
  "Бокал": {
    "en": "Glass",
    "fr": "Verre",
    "es": "Copa",
    "de": "Glas"
  },
  "Слои": {
    "en": "Layers",
    "fr": "Couches",
    "es": "Capas",
    "de": "Ebenen"
  },
  "Сердце": {
    "en": "Heart",
    "fr": "Cœur",
    "es": "Corazón",
    "de": "Herz"
  },
  "Лекарство": {
    "en": "Medication",
    "fr": "Médicament",
    "es": "Medicamento",
    "de": "Medikament"
  },
  "Сон": {
    "en": "Sleep",
    "fr": "Sommeil",
    "es": "Sueño",
    "de": "Schlaf"
  },
  "Солнце": {
    "en": "Sun",
    "fr": "Soleil",
    "es": "Sol",
    "de": "Sonne"
  },
  "Прогулка": {
    "en": "Walk",
    "fr": "Promenade",
    "es": "Paseo",
    "de": "Spaziergang"
  },
  "Тренировка": {
    "en": "Exercise",
    "fr": "Entraînement",
    "es": "Ejercicio",
    "de": "Training"
  },
  "Питание": {
    "en": "Nutrition",
    "fr": "Alimentation",
    "es": "Alimentación",
    "de": "Ernährung"
  },
  "Вода": {
    "en": "Water",
    "fr": "Eau",
    "es": "Agua",
    "de": "Wasser"
  },
  "Чай": {
    "en": "Tea",
    "fr": "Thé",
    "es": "Té",
    "de": "Tee"
  },
  "Цветок": {
    "en": "Flower",
    "fr": "Fleur",
    "es": "Flor",
    "de": "Blume"
  },
  "Горы": {
    "en": "Mountains",
    "fr": "Montagnes",
    "es": "Montañas",
    "de": "Berge"
  },
  "Книга": {
    "en": "Book",
    "fr": "Livre",
    "es": "Libro",
    "de": "Buch"
  },
  "Работа": {
    "en": "Work",
    "fr": "Travail",
    "es": "Trabajo",
    "de": "Arbeit"
  },
  "Дом": {
    "en": "Home",
    "fr": "Maison",
    "es": "Casa",
    "de": "Zuhause"
  },
  "Поездка": {
    "en": "Travel",
    "fr": "Voyage",
    "es": "Viaje",
    "de": "Reise"
  },
  "Щит": {
    "en": "Shield",
    "fr": "Bouclier",
    "es": "Escudo",
    "de": "Schild"
  },
  "Календарь": {
    "en": "Calendar",
    "fr": "Calendrier",
    "es": "Calendario",
    "de": "Kalender"
  },
  "Звезда": {
    "en": "Star",
    "fr": "Étoile",
    "es": "Estrella",
    "de": "Stern"
  },
  "Верхнее ↓": {
    "en": "Systolic ↓",
    "fr": "Systolique ↓",
    "es": "Sistólica ↓",
    "de": "Systolisch ↓"
  },
  "Верхнее ↑": {
    "en": "Systolic ↑",
    "fr": "Systolique ↑",
    "es": "Sistólica ↑",
    "de": "Systolisch ↑"
  },
  "Нижнее ↓": {
    "en": "Diastolic ↓",
    "fr": "Diastolique ↓",
    "es": "Diastólica ↓",
    "de": "Diastolisch ↓"
  },
  "Нижнее ↑": {
    "en": "Diastolic ↑",
    "fr": "Diastolique ↑",
    "es": "Diastólica ↑",
    "de": "Diastolisch ↑"
  },
  "Пульс ↓": {
    "en": "Pulse ↓",
    "fr": "Pouls ↓",
    "es": "Pulso ↓",
    "de": "Puls ↓"
  },
  "Пульс ↑": {
    "en": "Pulse ↑",
    "fr": "Pouls ↑",
    "es": "Pulso ↑",
    "de": "Puls ↑"
  },
  "Некорректная дата.": {
    "en": "Invalid date.",
    "fr": "Date incorrecte.",
    "es": "Fecha no válida.",
    "de": "Ungültiges Datum."
  },
  "Введите пульс.": {
    "en": "Enter the pulse.",
    "fr": "Saisissez le pouls.",
    "es": "Introduce el pulso.",
    "de": "Gib den Puls ein."
  },
  "Верхнее: 60–260; нижнее: 35–160; пульс: 30–220. Верхнее должно быть больше нижнего.": {
    "en": "Systolic: 60–260; diastolic: 35–160; pulse: 30–220. Systolic pressure must exceed diastolic pressure.",
    "fr": "Systolique : 60–260 ; diastolique : 35–160 ; pouls : 30–220. La pression systolique doit être supérieure à la diastolique.",
    "es": "Sistólica: 60–260; diastólica: 35–160; pulso: 30–220. La presión sistólica debe superar la diastólica.",
    "de": "Systolisch: 60–260; diastolisch: 35–160; Puls: 30–220. Der systolische Blutdruck muss höher als der diastolische sein."
  },
  "Укажите дату и время этого замера.": {
    "en": "Enter the date and time for this reading.",
    "fr": "Saisissez la date et l'heure de ce relevé.",
    "es": "Introduce la fecha y hora de esta medición.",
    "de": "Gib Datum und Uhrzeit dieser Messung ein."
  },
  "Проверьте запись.": {
    "en": "Check the record.",
    "fr": "Vérifiez la mesure.",
    "es": "Comprueba el registro.",
    "de": "Prüfe den Eintrag."
  },
  "Серия должна содержать 2–10 замеров.": {
    "en": "A series must contain 2–10 readings.",
    "fr": "Une série doit contenir 2 à 10 relevés.",
    "es": "Una serie debe contener entre 2 y 10 mediciones.",
    "de": "Eine Serie muss 2–10 Messungen enthalten."
  },
  "Самочувствие: от 1 до 10.": {
    "en": "Wellbeing must be from 1 to 10.",
    "fr": "Le score de bien-être doit être compris entre 1 et 10.",
    "es": "El bienestar debe ser de 1 a 10.",
    "de": "Das Wohlbefinden muss zwischen 1 und 10 liegen."
  },
  "Проверьте отметки и заметку.": {
    "en": "Check the tags and note.",
    "fr": "Vérifiez les étiquettes et la note.",
    "es": "Comprueba las etiquetas y la nota.",
    "de": "Prüfe die Markierungen und die Notiz."
  },
  "Проверьте текст заметки.": {
    "en": "Check the note text.",
    "fr": "Vérifiez le texte de la note.",
    "es": "Comprueba el texto de la nota.",
    "de": "Prüfe den Notiztext."
  },
  "Измерение не найдено.": {
    "en": "Measurement not found.",
    "fr": "Mesure introuvable.",
    "es": "Medición no encontrada.",
    "de": "Messung nicht gefunden."
  },
  "Неизвестный способ расчёта.": {
    "en": "Unknown calculation method.",
    "fr": "Méthode de calcul inconnue.",
    "es": "Método de cálculo desconocido.",
    "de": "Unbekannte Berechnungsmethode."
  },
  "Укажите название периода.": {
    "en": "Enter a period name.",
    "fr": "Saisissez le nom de la période.",
    "es": "Introduce un nombre para el período.",
    "de": "Gib einen Namen für den Zeitraum ein."
  },
  "Выберите значок периода.": {
    "en": "Choose a period icon.",
    "fr": "Choisissez une icône pour la période.",
    "es": "Elige un icono para el período.",
    "de": "Wähle ein Symbol für den Zeitraum."
  },
  "Выберите цвет периода.": {
    "en": "Choose a period colour.",
    "fr": "Choisissez une couleur pour la période.",
    "es": "Elige un color para el período.",
    "de": "Wähle eine Farbe für den Zeitraum."
  },
  "Выберите цвет и значок периода.": {
    "en": "Choose a colour and icon for the period.",
    "fr": "Choisissez une couleur et une icône pour la période.",
    "es": "Elige un color y un icono para el período.",
    "de": "Wähle eine Farbe und ein Symbol für den Zeitraum."
  },
  "Конец периода должен быть позже начала.": {
    "en": "The period must end after it starts.",
    "fr": "La fin de la période doit être postérieure au début.",
    "es": "El período debe finalizar después de su inicio.",
    "de": "Das Ende des Zeitraums muss nach dem Beginn liegen."
  },
  "Одновременно могут идти не более 3 периодов. Измените даты или завершите один из периодов.": {
    "en": "Up to 3 periods can run at once. Change the dates or end a period.",
    "fr": "Au maximum 3 périodes peuvent être actives en même temps. Modifiez les dates ou terminez une période.",
    "es": "Pueden estar activos hasta 3 períodos a la vez. Cambia las fechas o finaliza un período.",
    "de": "Es können höchstens 3 Zeiträume gleichzeitig laufen. Ändere die Daten oder beende einen Zeitraum."
  },
  "Период не найден.": {
    "en": "Period not found.",
    "fr": "Période introuvable.",
    "es": "Período no encontrado.",
    "de": "Zeitraum nicht gefunden."
  },
  "Завершить можно только действующий период.": {
    "en": "Only an active period can be ended.",
    "fr": "Seule une période active peut être terminée.",
    "es": "Solo se puede finalizar un período activo.",
    "de": "Nur ein aktiver Zeitraum kann beendet werden."
  },
  "Укажите корректные даты.": {
    "en": "Enter valid dates.",
    "fr": "Saisissez des dates valides.",
    "es": "Introduce fechas válidas.",
    "de": "Gib gültige Daten ein."
  },
  "Выберите интервал.": {
    "en": "Choose a range.",
    "fr": "Choisissez un intervalle.",
    "es": "Elige un intervalo.",
    "de": "Wähle einen Zeitraum."
  },
  "Выберите вид графика.": {
    "en": "Choose a chart view.",
    "fr": "Choisissez un affichage du graphique.",
    "es": "Elige una vista del gráfico.",
    "de": "Wähle eine Diagrammansicht."
  },
  "Выберите непустую резервную копию JSON приложения «Давление».": {
    "en": "Choose a non-empty JSON backup from the Pressure Diary app.",
    "fr": "Choisissez une sauvegarde JSON non vide de l'application de pression artérielle.",
    "es": "Elige una copia JSON no vacía de la aplicación Presión arterial.",
    "de": "Wähle eine nicht leere JSON-Sicherung der Blutdruck-App."
  },
  "Повторяющиеся или некорректные номера записей.": {
    "en": "Duplicate or invalid record numbers.",
    "fr": "Numéros de mesure en double ou incorrects.",
    "es": "Números de registro duplicados o no válidos.",
    "de": "Doppelte oder ungültige Eintragsnummern."
  },
  "Некорректные замеры в копии.": {
    "en": "Invalid readings in the backup.",
    "fr": "Relevés incorrects dans la sauvegarde.",
    "es": "Mediciones no válidas en la copia.",
    "de": "Ungültige Messungen in der Sicherung."
  },
  "Нарушен порядок замеров.": {
    "en": "The reading order is invalid.",
    "fr": "L'ordre des relevés est incorrect.",
    "es": "El orden de las mediciones no es válido.",
    "de": "Die Reihenfolge der Messungen ist ungültig."
  },
  "Некорректные периоды.": {
    "en": "Invalid periods.",
    "fr": "Périodes incorrectes.",
    "es": "Períodos no válidos.",
    "de": "Ungültige Zeiträume."
  },
  "Базовый период для сравнения.": {
    "en": "Baseline period for comparison.",
    "fr": "Période de référence pour la comparaison.",
    "es": "Período de referencia para comparar.",
    "de": "Basiszeitraum für den Vergleich."
  },
  "Утренний кофе": {
    "en": "Morning coffee",
    "fr": "Café du matin",
    "es": "Café de la mañana",
    "de": "Morgenkaffee"
  },
  "Отмечаю изменения в привычном режиме.": {
    "en": "Tracking changes in my usual routine.",
    "fr": "Suivi des changements dans mon rythme habituel.",
    "es": "Registrando cambios en mi rutina habitual.",
    "de": "Änderungen im gewohnten Alltag beobachten."
  },
  "Спокойный ритм": {
    "en": "Quiet rhythm",
    "fr": "Rythme paisible",
    "es": "Ritmo tranquilo",
    "de": "Ruhiger Rhythmus"
  },
  "Возвращаюсь к режиму без напитков.": {
    "en": "Returning to a routine without drinks.",
    "fr": "Retour à un rythme sans boissons.",
    "es": "Volviendo a la rutina sin bebidas.",
    "de": "Zurück zu einem Alltag ohne Getränke."
  },
  "После отдыха. Измерение сидя.": {
    "en": "After resting. Seated measurement.",
    "fr": "Après le repos. Mesure en position assise.",
    "es": "Después de descansar. Medición sentado.",
    "de": "Nach einer Ruhepause. Messung im Sitzen."
  },
  "Папка копии недоступна.": {
    "en": "The backup folder is unavailable.",
    "fr": "Le dossier de sauvegarde est inaccessible.",
    "es": "La carpeta de la copia no está disponible.",
    "de": "Der Sicherungsordner ist nicht verfügbar."
  },
  "Дневник сохранён, но не удалось вернуть файл копии.": {
    "en": "The diary was preserved, but the backup file could not be restored.",
    "fr": "Le journal a été conservé, mais le fichier de sauvegarde n'a pas pu être rétabli.",
    "es": "El diario se ha conservado, pero no se pudo restaurar el archivo de copia.",
    "de": "Das Tagebuch wurde erhalten, aber die Sicherungsdatei konnte nicht wiederhergestellt werden."
  },
  "Просмотр этой папки доступен в Windows.": {
    "en": "This folder can be viewed in Windows.",
    "fr": "Ce dossier peut être consulté sous Windows.",
    "es": "Esta carpeta se puede ver en Windows.",
    "de": "Dieser Ordner kann in Windows geöffnet werden."
  },
  "Неизвестный дневник.": {
    "en": "Unknown diary.",
    "fr": "Journal inconnu.",
    "es": "Diario desconocido.",
    "de": "Unbekanntes Tagebuch."
  },
  "Не удалось прочитать сохранённую копию.": {
    "en": "Could not read the saved backup.",
    "fr": "Impossible de lire la sauvegarde enregistrée.",
    "es": "No se pudo leer la copia guardada.",
    "de": "Die gespeicherte Sicherung konnte nicht gelesen werden."
  },
  "Файл копии повреждён. Сохраните его отдельно перед заменой.": {
    "en": "The backup file is damaged. Save it elsewhere before replacing it.",
    "fr": "Le fichier de sauvegarde est endommagé. Enregistrez-le ailleurs avant de le remplacer.",
    "es": "El archivo de copia está dañado. Guárdalo aparte antes de sustituirlo.",
    "de": "Die Sicherungsdatei ist beschädigt. Speichere sie separat, bevor du sie ersetzt."
  },
  "В папке уже находится другой файл с именем копии.": {
    "en": "Another file with the backup name already exists in this folder.",
    "fr": "Un autre fichier portant le nom de la sauvegarde se trouve déjà dans ce dossier.",
    "es": "Ya existe otro archivo con el nombre de la copia en esta carpeta.",
    "de": "In diesem Ordner gibt es bereits eine andere Datei mit dem Namen der Sicherung."
  },
  "Некорректная копия.": {
    "en": "Invalid backup.",
    "fr": "Sauvegarde incorrecte.",
    "es": "Copia no válida.",
    "de": "Ungültige Sicherung."
  },
  "Папка уже содержит другую копию.": {
    "en": "The folder already contains another backup.",
    "fr": "Le dossier contient déjà une autre sauvegarde.",
    "es": "La carpeta ya contiene otra copia.",
    "de": "Der Ordner enthält bereits eine andere Sicherung."
  },
  "Неизвестное действие.": {
    "en": "Unknown action.",
    "fr": "Action inconnue.",
    "es": "Acción desconocida.",
    "de": "Unbekannte Aktion."
  },
  "Не удалось записать файл копии.": {
    "en": "Could not write the backup file.",
    "fr": "Impossible d'écrire le fichier de sauvegarde.",
    "es": "No se pudo escribir el archivo de copia.",
    "de": "Die Sicherungsdatei konnte nicht geschrieben werden."
  },
  "Действие недоступно.": {
    "en": "This action is unavailable.",
    "fr": "Cette action n'est pas disponible.",
    "es": "Esta acción no está disponible.",
    "de": "Diese Aktion ist nicht verfügbar."
  },
  "Откройте дневник на localhost.": {
    "en": "Open the diary on localhost.",
    "fr": "Ouvrez le journal sur localhost.",
    "es": "Abre el diario en localhost.",
    "de": "Öffne das Tagebuch auf localhost."
  },
  "Действие не найдено.": {
    "en": "Action not found.",
    "fr": "Action introuvable.",
    "es": "Acción no encontrada.",
    "de": "Aktion nicht gefunden."
  },
  "Файл копии слишком большой.": {
    "en": "The backup file is too large.",
    "fr": "Le fichier de sauvegarde est trop volumineux.",
    "es": "El archivo de copia es demasiado grande.",
    "de": "Die Sicherungsdatei ist zu groß."
  },
  "Папка копии недоступна. Попробуйте ещё раз.": {
    "en": "The backup folder is unavailable. Try again.",
    "fr": "Le dossier de sauvegarde est inaccessible. Réessayez.",
    "es": "La carpeta de la copia no está disponible. Inténtalo de nuevo.",
    "de": "Der Sicherungsordner ist nicht verfügbar. Versuche es erneut."
  },
  "Интерфейс": {
    "en": "Interface",
    "fr": "Interface",
    "es": "Interfaz",
    "de": "Oberfläche"
  },
  "Язык приложения": {
    "en": "App language",
    "fr": "Langue de l'application",
    "es": "Idioma de la aplicación",
    "de": "App-Sprache"
  },
  "Не удалось сохранить язык. Попробуйте ещё раз.": {
    "en": "The language could not be saved. Try again.",
    "fr": "La langue n'a pas pu être enregistrée. Réessayez.",
    "es": "No se pudo guardar el idioma. Inténtalo de nuevo.",
    "de": "Die Sprache konnte nicht gespeichert werden. Versuche es erneut."
  },
  "{{0}} · Дневник давления": {
    "en": "{{0}} · Blood pressure diary",
    "fr": "{{0}} · Journal de pression artérielle",
    "es": "{{0}} · Diario de presión arterial",
    "de": "{{0}} · Blutdrucktagebuch"
  },
  "Проверь замер": {
    "en": "Check the record.",
    "fr": "Vérifiez la mesure.",
    "es": "Comprueba el registro.",
    "de": "Prüfe den Eintrag."
  },
  "САМОЧУВСТВИЕ": {
    "en": "Wellbeing",
    "fr": "Bien-être",
    "es": "Bienestar",
    "de": "Wohlbefinden"
  },
  "Как ты себя чувствуешь?": {
    "en": "How do you feel?",
    "fr": "Comment vous sentez-vous ?",
    "es": "¿Cómo te sientes?",
    "de": "Wie fühlst du dich?"
  },
  "ЗАМЕТКА": {
    "en": "Note",
    "fr": "Note",
    "es": "Nota",
    "de": "Notiz"
  },
  "Проверь даты": {
    "en": "Check dates",
    "fr": "Vérifier les dates",
    "es": "Comprueba las fechas",
    "de": "Daten prüfen"
  },
  "НАЗВАНИЕ": {
    "en": "Name",
    "fr": "Nom",
    "es": "Nombre",
    "de": "Name"
  },
  "НАЧАЛО": {
    "en": "Start",
    "fr": "Début",
    "es": "Inicio",
    "de": "Beginn"
  },
  "ОКОНЧАНИЕ": {
    "en": "End",
    "fr": "Fin",
    "es": "Finalización",
    "de": "Ende"
  },
  "Удалить период": {
    "en": "Delete period",
    "fr": "Supprimer la période",
    "es": "Eliminar período",
    "de": "Zeitraum löschen"
  },
  "ВСЕ ЗАПИСИ": {
    "en": "All records",
    "fr": "Toutes les mesures",
    "es": "Todos los registros",
    "de": "Alle Einträge"
  },
  "измерения": {
    "en": "Measurements",
    "fr": "Mesures",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "измерений": {
    "en": "Measurements",
    "fr": "Mesures",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "последние": {
    "en": "Last",
    "fr": "Derniers",
    "es": "Últimos",
    "de": "Letzte"
  },
  "Систолическое": {
    "en": "Systolic",
    "fr": "Systolique",
    "es": "Sistólica",
    "de": "Systolisch"
  },
  "Диастолическое": {
    "en": "Diastolic",
    "fr": "Diastolique",
    "es": "Diastólica",
    "de": "Diastolisch"
  },
  "идёт сейчас": {
    "en": "Ongoing",
    "fr": "En cours",
    "es": "En curso",
    "de": "Laufend"
  },
  "периоды": {
    "en": "Periods",
    "fr": "Périodes",
    "es": "Períodos",
    "de": "Zeiträume"
  },
  "без напитков": {
    "en": "No drinks",
    "fr": "Sans boissons",
    "es": "Sin bebidas",
    "de": "Ohne Getränke"
  },
  "Начать новый период": {
    "en": "Create a new period",
    "fr": "Créer une nouvelle période",
    "es": "Crear un nuevo período",
    "de": "Neuen Zeitraum erstellen"
  },
  "Не удалось открыть папку.": {
    "en": "Could not open the folder:",
    "fr": "Impossible d'ouvrir le dossier :",
    "es": "No se pudo abrir la carpeta:",
    "de": "Ordner konnte nicht geöffnet werden:"
  },
  "Сначала сохрани хотя бы одно своё измерение.": {
    "en": "Save at least one measurement first.",
    "fr": "Enregistrez d'abord au moins une mesure.",
    "es": "Guarda al menos una medición primero.",
    "de": "Speichere zuerst mindestens eine Messung."
  },
  "Систолическое, мм рт. ст.": {
    "en": "Systolic, mmHg",
    "fr": "Systolique, mmHg",
    "es": "Sistólica, mmHg",
    "de": "Systolisch, mmHg"
  },
  "Диастолическое, мм рт. ст.": {
    "en": "Diastolic, mmHg",
    "fr": "Diastolique, mmHg",
    "es": "Diastólica, mmHg",
    "de": "Diastolisch, mmHg"
  },
  "Самочувствие, из 10": {
    "en": "Wellbeing, 1–10",
    "fr": "Bien-être, 1–10",
    "es": "Bienestar, 1–10",
    "de": "Wohlbefinden, 1–10"
  },
  "Количество замеров": {
    "en": "Readings",
    "fr": "Relevés",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "Запись": {
    "en": "record",
    "fr": "mesure",
    "es": "registro",
    "de": "Eintrag"
  },
  "Окончание": {
    "en": "End",
    "fr": "Fin",
    "es": "Finalización",
    "de": "Ende"
  },
  "Не получилось создать файл": {
    "en": "Export failed",
    "fr": "Échec de l'export",
    "es": "Error al exportar",
    "de": "Export fehlgeschlagen"
  },
  "Выбери резервную копию, созданную приложением.": {
    "en": "Choose a JSON backup from the Pressure Diary app.",
    "fr": "Choisissez une sauvegarde JSON de l'application de pression artérielle.",
    "es": "Elige una copia JSON de la aplicación Presión arterial.",
    "de": "Wähle eine JSON-Sicherung aus der Blutdruck-App."
  },
  "Экспортировать Excel": {
    "en": "Export Excel",
    "fr": "Exporter vers Excel",
    "es": "Exportar Excel",
    "de": "Excel exportieren"
  },
  "Периоды и резервная копия останутся": {
    "en": "Periods and the backup will remain.",
    "fr": "Les périodes et la sauvegarde seront conservées.",
    "es": "Se conservarán los períodos y la copia de seguridad.",
    "de": "Zeiträume und Sicherung bleiben erhalten."
  },
  "ОБЗОР ПОКАЗАТЕЛЕЙ": {
    "en": "Values",
    "fr": "Valeurs",
    "es": "Valores",
    "de": "Messwerte"
  },
  "Систолическое и диастолическое": {
    "en": "Systolic + diastolic",
    "fr": "Systolique + diastolique",
    "es": "Sistólica + diastólica",
    "de": "Systolisch + diastolisch"
  },
  "Нет измерений в выбранном интервале": {
    "en": "No measurements in this range",
    "fr": "Aucune mesure dans cet intervalle",
    "es": "No hay mediciones en este intervalo",
    "de": "Keine Messungen in diesem Zeitraum"
  },
  "Диапазон": {
    "en": "Reading range",
    "fr": "Plage des relevés",
    "es": "Rango de mediciones",
    "de": "Messwertbereich"
  },
  "минимум — максимум": {
    "en": "Minimum and maximum",
    "fr": "Minimum et maximum",
    "es": "Mínimo y máximo",
    "de": "Minimum und Maximum"
  },
  "Не получилось сохранить заметку": {
    "en": "Could not save the note:",
    "fr": "Impossible d'enregistrer la note :",
    "es": "No se pudo guardar la nota:",
    "de": "Notiz konnte nicht gespeichert werden:"
  },
  "Измерение не найдено": {
    "en": "Measurement not found.",
    "fr": "Mesure introuvable.",
    "es": "Medición no encontrada.",
    "de": "Messung nicht gefunden."
  },
  "метку периода": {
    "en": "Period",
    "fr": "Période",
    "es": "Período",
    "de": "Zeitraum"
  },
  "Период:": {
    "en": "period",
    "fr": "période",
    "es": "período",
    "de": "Zeitraum"
  },
  "СРЕДНИЕ ЗНАЧЕНИЯ": {
    "en": "Average values",
    "fr": "Valeurs moyennes",
    "es": "Valores medios",
    "de": "Durchschnittswerte"
  },
  "ПОКАЗАТЕЛИ": {
    "en": "Values",
    "fr": "Valeurs",
    "es": "Valores",
    "de": "Messwerte"
  },
  "ЗАМЕРЫ СЕРИИ": {
    "en": "Original readings",
    "fr": "Relevés d'origine",
    "es": "Mediciones originales",
    "de": "Ursprüngliche Messungen"
  },
  "Сист.": {
    "en": "Systolic",
    "fr": "Systolique",
    "es": "Sistólica",
    "de": "Systolisch"
  },
  "Диаст.": {
    "en": "Diastolic",
    "fr": "Diastolique",
    "es": "Diastólica",
    "de": "Diastolisch"
  },
  "Не получилось завершить период": {
    "en": "Could not end the period",
    "fr": "Impossible de terminer la période",
    "es": "No se pudo finalizar el período",
    "de": "Zeitraum konnte nicht beendet werden"
  },
  "Завершить период": {
    "en": "End period",
    "fr": "Terminer la période",
    "es": "Finalizar período",
    "de": "Zeitraum beenden"
  },
  "СРЕДНЕЕ ЗА ПЕРИОД": {
    "en": "Period averages",
    "fr": "Moyennes de la période",
    "es": "Promedios del período",
    "de": "Durchschnittswerte im Zeitraum"
  },
  "ДИНАМИКА ВНУТРИ ПЕРИОДА": {
    "en": "Trend",
    "fr": "Évolution",
    "es": "Evolución",
    "de": "Verlauf"
  },
  "ИЗМЕРЕНИЯ ПЕРИОДА": {
    "en": "Measurements",
    "fr": "Mesures",
    "es": "Mediciones",
    "de": "Messungen"
  },
  "В этот период измерений пока нет.": {
    "en": "No measurements in this period yet",
    "fr": "Aucune mesure dans cette période pour le moment",
    "es": "Aún no hay mediciones en este período",
    "de": "Noch keine Messungen in diesem Zeitraum"
  },
  "Сначала большие значения": {
    "en": "Highest first",
    "fr": "Les plus élevées",
    "es": "Más altos primero",
    "de": "Höchste zuerst"
  },
  "Сначала меньшие значения": {
    "en": "Lowest first",
    "fr": "Les plus basses",
    "es": "Más bajos primero",
    "de": "Niedrigste zuerst"
  },
  "Проверь период": {
    "en": "Check the period dates",
    "fr": "Vérifier les dates de la période",
    "es": "Comprueba las fechas del período",
    "de": "Zeitraumdaten prüfen"
  },
  "Период измерений": {
    "en": "Observation period",
    "fr": "Période de suivi",
    "es": "Período de seguimiento",
    "de": "Beobachtungszeitraum"
  },
  "ДАТА И ВРЕМЯ": {
    "en": "Date and time",
    "fr": "Date et heure",
    "es": "Fecha y hora",
    "de": "Datum und Uhrzeit"
  },
  "Сохранено": {
    "en": "saved",
    "fr": "enregistrées",
    "es": "guardados",
    "de": "gespeichert"
  },
  "уд/м": {
    "en": "bpm",
    "fr": "bpm",
    "es": "lat/min",
    "de": "Schläge/min"
  },
  "Заполни давление и пульс. Систолическое должно быть выше диастолического.": {
    "en": "Enter blood pressure and pulse. Systolic pressure must exceed diastolic pressure.",
    "fr": "Saisissez la tension et le pouls. La tension systolique doit dépasser la diastolique.",
    "es": "Introduce la presión y el pulso. La presión sistólica debe superar la diastólica.",
    "de": "Gib Blutdruck und Puls ein. Der systolische Blutdruck muss höher als der diastolische sein."
  },
  "Проверь серию": {
    "en": "Check the series",
    "fr": "Vérifiez la série",
    "es": "Comprueba la serie",
    "de": "Serie prüfen"
  },
  "Заверши добавленные замеры в разделе «Серия». В серии может быть не больше трёх замеров.": {
    "en": "Complete the readings in the Series section. A series can contain up to three readings.",
    "fr": "Complétez les relevés dans la section Série. Une série peut contenir jusqu'à trois relevés.",
    "es": "Completa las mediciones de la sección Serie. Una serie puede contener hasta tres mediciones.",
    "de": "Vervollständige die Messungen im Bereich Serie. Eine Serie kann höchstens drei Messungen enthalten."
  },
  "В серии должно быть от двух до трёх замеров.": {
    "en": "A series must contain two to three readings.",
    "fr": "Une série doit contenir deux à trois relevés.",
    "es": "Una serie debe contener entre dos y tres mediciones.",
    "de": "Eine Serie muss zwei bis drei Messungen enthalten."
  },
  "Не хватает данных": {
    "en": "Missing data",
    "fr": "Données manquantes",
    "es": "Faltan datos",
    "de": "Fehlende Daten"
  },
  "Заполни показатели каждого добавленного замера или удали незаполненный замер.": {
    "en": "Complete each added reading or remove incomplete readings.",
    "fr": "Complétez chaque relevé ajouté ou supprimez les relevés incomplets.",
    "es": "Completa cada medición añadida o elimina las incompletas.",
    "de": "Vervollständige jede hinzugefügte Messung oder entferne unvollständige Messungen."
  },
  "Проверь значения": {
    "en": "Check the values",
    "fr": "Vérifiez les valeurs",
    "es": "Comprueba los valores",
    "de": "Werte prüfen"
  },
  "Систолическое давление должно быть выше диастолического.": {
    "en": "Systolic pressure must exceed diastolic pressure.",
    "fr": "La tension systolique doit dépasser la diastolique.",
    "es": "La presión sistólica debe superar la diastólica.",
    "de": "Der systolische Blutdruck muss höher als der diastolische sein."
  },
  "Не получилось сохранить": {
    "en": "Could not save",
    "fr": "Enregistrement impossible",
    "es": "No se pudo guardar",
    "de": "Speichern fehlgeschlagen"
  },
  "Попробуй ещё раз.": {
    "en": "Try again.",
    "fr": "Réessayez.",
    "es": "Inténtalo de nuevo.",
    "de": "Versuche es erneut."
  },
  "Добавь показатели тонометра": {
    "en": "Enter your monitor readings",
    "fr": "Saisissez les valeurs du tensiomètre",
    "es": "Introduce los valores del tensiómetro",
    "de": "Gib die Werte des Blutdruckmessgeräts ein"
  },
  "Добавить ещё 1 замер": {
    "en": "Add one more reading",
    "fr": "Ajouter un relevé",
    "es": "Añadir otra medición",
    "de": "Eine weitere Messung hinzufügen"
  },
  "Добавлены три замера. Заполни показатели и сохрани серию.": {
    "en": "Three readings added. Complete their values and save the series.",
    "fr": "Trois relevés ajoutés. Complétez leurs valeurs et enregistrez la série.",
    "es": "Se han añadido tres mediciones. Completa sus valores y guarda la serie.",
    "de": "Drei Messungen hinzugefügt. Vervollständige die Werte und speichere die Serie."
  },
  "В серии 2–3 замера. Следующий можно добавить после заполнения предыдущего.": {
    "en": "A series has 2–3 readings. Complete a reading before adding the next.",
    "fr": "Une série contient 2–3 relevés. Complétez un relevé avant d'ajouter le suivant.",
    "es": "Una serie tiene 2–3 mediciones. Completa una medición antes de añadir la siguiente.",
    "de": "Eine Serie enthält 2–3 Messungen. Vervollständige eine Messung, bevor du die nächste hinzufügst."
  },
  "Дата серии — дата первого замера. Самочувствие и заметка общие для серии.": {
    "en": "The series date is the first reading's date. Wellbeing and note apply to the whole series.",
    "fr": "La date de la série est celle du premier relevé. Le bien-être et la note sont communs à la série.",
    "es": "La fecha de la serie es la de la primera medición. El bienestar y la nota se aplican a toda la serie.",
    "de": "Das Datum der Serie entspricht der ersten Messung. Wohlbefinden und Notiz gelten für die ganze Serie."
  },
  "Оценка самочувствия": {
    "en": "Wellbeing score",
    "fr": "Note de bien-être",
    "es": "Puntuación de bienestar",
    "de": "Bewertung des Wohlbefindens"
  },
  "Например: после прогулки, до приёма лекарства…": {
    "en": "For example: after a walk, before medication…",
    "fr": "Par exemple : après une promenade, avant un médicament…",
    "es": "Por ejemplo: después de pasear, antes de la medicación…",
    "de": "Zum Beispiel: nach einem Spaziergang, vor Medikamenten…"
  },
  "Готово измерений:": {
    "en": "Completed readings:",
    "fr": "Relevés terminés :",
    "es": "Mediciones completadas:",
    "de": "Vollständige Messungen:"
  },
  "— нужен ещё один замер": {
    "en": "— one more reading needed",
    "fr": "— un relevé supplémentaire est nécessaire",
    "es": "— se necesita otra medición",
    "de": "— eine weitere Messung erforderlich"
  },
  "Сохраняем…": {
    "en": "Saving…",
    "fr": "Enregistrement…",
    "es": "Guardando…",
    "de": "Wird gespeichert…"
  },
  "Сохранить измерение": {
    "en": "Save measurement",
    "fr": "Enregistrer la mesure",
    "es": "Guardar medición",
    "de": "Messung speichern"
  },
  "Серия добавлена в дневник": {
    "en": "Series added to the diary",
    "fr": "Série ajoutée au journal",
    "es": "Serie añadida al diario",
    "de": "Serie zum Tagebuch hinzugefügt"
  },
  "Измерение добавлено в дневник": {
    "en": "Measurement added to the diary",
    "fr": "Mesure ajoutée au journal",
    "es": "Medición añadida al diario",
    "de": "Messung zum Tagebuch hinzugefügt"
  },
  "Без всего": {
    "en": "No drinks",
    "fr": "Sans boissons",
    "es": "Sin bebidas",
    "de": "Ohne Getränke"
  },
  "Нужно название": {
    "en": "Name required",
    "fr": "Nom requis",
    "es": "Hace falta un nombre",
    "de": "Name erforderlich"
  },
  "Назови период, чтобы отличать его в списке.": {
    "en": "Name the period to distinguish it in the list.",
    "fr": "Nommez la période pour la distinguer dans la liste.",
    "es": "Pon un nombre al período para distinguirlo en la lista.",
    "de": "Gib dem Zeitraum einen Namen, um ihn in der Liste zu erkennen."
  },
  "Измерения останутся на месте — исчезнет только разбиение на эксперименты.": {
    "en": "Measurements will stay; only the experiment grouping will be removed.",
    "fr": "Les mesures resteront ; seul le regroupement par expériences sera supprimé.",
    "es": "Las mediciones se conservarán; solo se eliminará la agrupación por experimentos.",
    "de": "Messungen bleiben erhalten; nur die Einteilung in Experimente wird entfernt."
  },
  "Не получилось удалить период": {
    "en": "Could not delete the period",
    "fr": "Suppression de la période impossible",
    "es": "No se pudo eliminar el período",
    "de": "Zeitraum konnte nicht gelöscht werden"
  },
  "Попробуй ещё раз. Измерения сохранены.": {
    "en": "Try again. Measurements have been preserved.",
    "fr": "Réessayez. Les mesures ont été conservées.",
    "es": "Inténtalo de nuevo. Las mediciones se han conservado.",
    "de": "Versuche es erneut. Die Messungen wurden erhalten."
  },
  "Период не найден. Вернитесь к списку периодов.": {
    "en": "Period not found. Return to the period list.",
    "fr": "Période introuvable. Revenez à la liste des périodes.",
    "es": "Período no encontrado. Vuelve a la lista de períodos.",
    "de": "Zeitraum nicht gefunden. Kehre zur Liste der Zeiträume zurück."
  },
  "Можно поправить даты и название": {
    "en": "You can change dates and name",
    "fr": "Vous pouvez modifier les dates et le nom",
    "es": "Puedes cambiar las fechas y el nombre",
    "de": "Du kannst Daten und Namen ändern"
  },
  "Предыдущий период закроется сам": {
    "en": "The previous period will end automatically",
    "fr": "La période précédente se terminera automatiquement",
    "es": "El período anterior finalizará automáticamente",
    "de": "Der vorherige Zeitraum wird automatisch beendet"
  },
  "Загружаем период…": {
    "en": "Loading period…",
    "fr": "Chargement de la période…",
    "es": "Cargando período…",
    "de": "Zeitraum wird geladen…"
  },
  "ЧТО В ЭТОТ ПЕРИОД": {
    "en": "DURING THIS PERIOD",
    "fr": "PENDANT CETTE PÉRIODE",
    "es": "DURANTE ESTE PERÍODO",
    "de": "IN DIESEM ZEITRAUM"
  },
  "Например: Кофе, вторая попытка": {
    "en": "For example: Coffee, second attempt",
    "fr": "Par exemple : Café, deuxième essai",
    "es": "Por ejemplo: Café, segundo intento",
    "de": "Zum Beispiel: Kaffee, zweiter Versuch"
  },
  "Пока выключено, период считается текущим и не имеет конца": {
    "en": "While disabled, the period is ongoing and has no end date",
    "fr": "Tant que cette option est désactivée, la période est en cours sans date de fin",
    "es": "Mientras esté desactivado, el período sigue en curso sin fecha de finalización",
    "de": "Solange dies deaktiviert ist, läuft der Zeitraum ohne Enddatum weiter"
  },
  "Заметка к периоду": {
    "en": "Period note",
    "fr": "Note de la période",
    "es": "Nota del período",
    "de": "Zeitraumnotiz"
  },
  "Например: 1–2 чашки в день, после обеда не пью": {
    "en": "For example: 1–2 cups a day, none after lunch",
    "fr": "Par exemple : 1–2 tasses par jour, pas après le déjeuner",
    "es": "Por ejemplo: 1–2 tazas al día, ninguna después de comer",
    "de": "Zum Beispiel: 1–2 Tassen täglich, keine nach dem Mittagessen"
  },
  "Сохранить изменения": {
    "en": "Save changes",
    "fr": "Enregistrer les modifications",
    "es": "Guardar cambios",
    "de": "Änderungen speichern"
  },
  "Начать период": {
    "en": "Start period",
    "fr": "Commencer la période",
    "es": "Iniciar período",
    "de": "Zeitraum beginnen"
  },
  "Период добавлен в дневник": {
    "en": "Period added to the diary",
    "fr": "Période ajoutée au journal",
    "es": "Período añadido al diario",
    "de": "Zeitraum zum Tagebuch hinzugefügt"
  },
  "Окончание периода": {
    "en": "Period end",
    "fr": "Fin de la période",
    "es": "Fin del período",
    "de": "Zeitraumende"
  },
  "Начало периода": {
    "en": "Period start",
    "fr": "Début de la période",
    "es": "Inicio del período",
    "de": "Zeitraumbeginn"
  },
  "Дата": {
    "en": "Date",
    "fr": "Date",
    "es": "Fecha",
    "de": "Datum"
  },
  "Время": {
    "en": "Time",
    "fr": "Heure",
    "es": "Hora",
    "de": "Uhrzeit"
  },
  "по фильтрам": {
    "en": "filtered",
    "fr": "filtrés",
    "es": "filtrados",
    "de": "gefiltert"
  },
  "метки периодов": {
    "en": "period labels",
    "fr": "les étiquettes des périodes",
    "es": "las etiquetas de períodos",
    "de": "Zeitraummarkierungen"
  },
  "Не удалось загрузить записи. Повторить": {
    "en": "Could not load records. Retry",
    "fr": "Chargement des mesures impossible. Réessayer",
    "es": "No se pudieron cargar los registros. Reintentar",
    "de": "Einträge konnten nicht geladen werden. Erneut versuchen"
  },
  "Загружаем…": {
    "en": "Loading…",
    "fr": "Chargement…",
    "es": "Cargando…",
    "de": "Wird geladen…"
  },
  "Нет записей по выбранным фильтрам": {
    "en": "No records match the selected filters",
    "fr": "Aucune mesure ne correspond aux filtres",
    "es": "No hay registros con los filtros seleccionados",
    "de": "Keine Einträge für die ausgewählten Filter"
  },
  "Измени период в фильтрах истории.": {
    "en": "Change the range in the history filters.",
    "fr": "Modifiez l'intervalle dans les filtres de l'historique.",
    "es": "Cambia el intervalo en los filtros del historial.",
    "de": "Ändere den Zeitraum in den Verlaufsfiltern."
  },
  "Добавь первое измерение, и оно появится здесь.": {
    "en": "Add your first measurement and it will appear here.",
    "fr": "Ajoutez votre première mesure et elle apparaîtra ici.",
    "es": "Añade tu primera medición y aparecerá aquí.",
    "de": "Füge deine erste Messung hinzu; sie erscheint dann hier."
  },
  "ДНЕВНИК ЗДОРОВЬЯ": {
    "en": "HEALTH DIARY",
    "fr": "JOURNAL DE SANTÉ",
    "es": "DIARIO DE SALUD",
    "de": "GESUNDHEITSTAGEBUCH"
  },
  "Добавьте первую запись — это займёт меньше минуты.": {
    "en": "Add your first record — it takes less than a minute.",
    "fr": "Ajoutez votre première mesure — cela prend moins d'une minute.",
    "es": "Añade tu primer registro — lleva menos de un minuto.",
    "de": "Füge deinen ersten Eintrag hinzu — das dauert weniger als eine Minute."
  },
  "Пока нет измерений в этом периоде": {
    "en": "No measurements in this period yet",
    "fr": "Aucune mesure dans cette période pour le moment",
    "es": "Aún no hay mediciones en este período",
    "de": "Noch keine Messungen in diesem Zeitraum"
  },
  "ЭКСПЕРИМЕНТЫ": {
    "en": "EXPERIMENTS",
    "fr": "EXPÉRIENCES",
    "es": "EXPERIMENTOS",
    "de": "EXPERIMENTE"
  },
  "История разбита на отрезки: что именно ты пил в это время. Общий список и графики от этого не меняются.": {
    "en": "History is grouped by what you drank during each period. The full list and charts remain unchanged.",
    "fr": "L'historique est regroupé selon les boissons consommées pendant chaque période. La liste complète et les graphiques restent inchangés.",
    "es": "El historial se agrupa según lo que bebiste en cada período. La lista completa y los gráficos no cambian.",
    "de": "Der Verlauf wird nach den Getränken in jedem Zeitraum gruppiert. Die Gesamtliste und die Diagramme bleiben unverändert."
  },
  "База — чистые периоды:": {
    "en": "Baseline — periods without drinks:",
    "fr": "Référence — périodes sans boissons :",
    "es": "Referencia — períodos sin bebidas:",
    "de": "Basis — Zeiträume ohne Getränke:"
  },
  ", пульс": {
    "en": ", pulse",
    "fr": ", pouls",
    "es": ", pulso",
    "de": ", Puls"
  },
  ", самочувствие": {
    "en": ", wellbeing",
    "fr": ", bien-être",
    "es": ", bienestar",
    "de": ", Wohlbefinden"
  },
  "Создай первый — например, «Без всего» — и история начнёт делиться на эксперименты.": {
    "en": "Create the first period, such as “No drinks”, to group history by experiments.",
    "fr": "Créez une première période, par exemple « Sans boissons », pour regrouper l'historique par expériences.",
    "es": "Crea el primer período, por ejemplo «Sin bebidas», para agrupar el historial por experimentos.",
    "de": "Erstelle den ersten Zeitraum, etwa „Ohne Getränke“, um den Verlauf nach Experimenten zu gruppieren."
  },
  "Нажмите, чтобы открыть папку. Удерживайте, чтобы изменить место сохранения.": {
    "en": "Tap to open the folder. Hold to change the backup location.",
    "fr": "Touchez pour ouvrir le dossier. Maintenez pour modifier l'emplacement de sauvegarde.",
    "es": "Toca para abrir la carpeta. Mantén pulsado para cambiar dónde se guarda la copia.",
    "de": "Tippe, um den Ordner zu öffnen. Halte gedrückt, um den Speicherort zu ändern."
  },
  "Папка копии недоступна. Выберите её снова.": {
    "en": "The backup folder is unavailable. Select it again.",
    "fr": "Le dossier de sauvegarde est indisponible. Sélectionnez-le à nouveau.",
    "es": "La carpeta de la copia no está disponible. Selecciónala de nuevo.",
    "de": "Der Sicherungsordner ist nicht verfügbar. Wähle ihn erneut aus."
  },
  "Настройка не сохранена": {
    "en": "Setting not saved",
    "fr": "Réglage non enregistré",
    "es": "Ajuste no guardado",
    "de": "Einstellung nicht gespeichert"
  },
  "Попробуйте переключить автоматическую копию ещё раз.": {
    "en": "Try switching automatic backup again.",
    "fr": "Essayez à nouveau de modifier la sauvegarde automatique.",
    "es": "Intenta cambiar la copia automática de nuevo.",
    "de": "Versuche erneut, die automatische Sicherung umzuschalten."
  },
  "Папка недоступна": {
    "en": "Folder unavailable",
    "fr": "Dossier indisponible",
    "es": "Carpeta no disponible",
    "de": "Ordner nicht verfügbar"
  },
  "Заменить копию в этой папке?": {
    "en": "Replace the backup in this folder?",
    "fr": "Remplacer la sauvegarde dans ce dossier ?",
    "es": "¿Sustituir la copia de esta carpeta?",
    "de": "Sicherung in diesem Ordner ersetzen?"
  },
  "В выбранной папке уже есть": {
    "en": "The selected folder already contains",
    "fr": "Le dossier sélectionné contient déjà",
    "es": "La carpeta seleccionada ya contiene",
    "de": "Der ausgewählte Ordner enthält bereits"
  },
  "Заменить": {
    "en": "Replace",
    "fr": "Remplacer",
    "es": "Sustituir",
    "de": "Ersetzen"
  },
  "Папка не изменена": {
    "en": "Folder not changed",
    "fr": "Dossier non modifié",
    "es": "Carpeta no cambiada",
    "de": "Ordner nicht geändert"
  },
  "Не удалось перенести копию.": {
    "en": "Could not move the backup.",
    "fr": "Déplacement de la sauvegarde impossible.",
    "es": "No se pudo mover la copia.",
    "de": "Die Sicherung konnte nicht verschoben werden."
  },
  "Не удалось выбрать папку.": {
    "en": "Could not select the folder.",
    "fr": "Sélection du dossier impossible.",
    "es": "No se pudo seleccionar la carpeta.",
    "de": "Der Ordner konnte nicht ausgewählt werden."
  },
  "Копия недоступна": {
    "en": "Backup unavailable",
    "fr": "Sauvegarde indisponible",
    "es": "Copia no disponible",
    "de": "Sicherung nicht verfügbar"
  },
  "Не удалось прочитать копию.": {
    "en": "Could not read the backup.",
    "fr": "Lecture de la sauvegarde impossible.",
    "es": "No se pudo leer la copia.",
    "de": "Die Sicherung konnte nicht gelesen werden."
  },
  "Не удалось удалить данные или копию. Проверьте доступ к папке копии и повторите.": {
    "en": "Could not delete data or the backup. Check access to the backup folder and try again.",
    "fr": "Suppression des données ou de la sauvegarde impossible. Vérifiez l'accès au dossier et réessayez.",
    "es": "No se pudieron eliminar los datos o la copia. Comprueba el acceso a la carpeta de copia e inténtalo de nuevo.",
    "de": "Daten oder Sicherung konnten nicht gelöscht werden. Prüfe den Zugriff auf den Sicherungsordner und versuche es erneut."
  },
  "Период эксперимента": {
    "en": "Experiment period",
    "fr": "Période d'expérience",
    "es": "Período del experimento",
    "de": "Experimentzeitraum"
  },
  "Дневник артериального давления": {
    "en": "Blood pressure diary",
    "fr": "Journal de tension artérielle",
    "es": "Diario de presión arterial",
    "de": "Blutdrucktagebuch"
  },
  "Экспорт измерений": {
    "en": "Measurement export",
    "fr": "Export des mesures",
    "es": "Exportación de mediciones",
    "de": "Messungsexport"
  },
  "Номер замера": {
    "en": "Reading number",
    "fr": "Numéro du relevé",
    "es": "Número de medición",
    "de": "Messungsnummer"
  },
  "Что употреблялось": {
    "en": "Drinks consumed",
    "fr": "Boissons consommées",
    "es": "Bebidas consumidas",
    "de": "Konsumierte Getränke"
  },
  "продолжается": {
    "en": "ongoing",
    "fr": "en cours",
    "es": "en curso",
    "de": "laufend"
  },
  "неизвестная ошибка": {
    "en": "unknown error",
    "fr": "erreur inconnue",
    "es": "error desconocido",
    "de": "unbekannter Fehler"
  },
  "Не удалось экспортировать файл:": {
    "en": "Could not export the file:",
    "fr": "Export du fichier impossible :",
    "es": "No se pudo exportar el archivo:",
    "de": "Datei konnte nicht exportiert werden:"
  },
  "Причина: {{0}}\n\nСообщи этот текст, если ошибка повторится.": {
    "en": "Reason: {{0}}\n\nReport this text if the error recurs.",
    "fr": "Cause : {{0}}\n\nSignalez ce texte si l'erreur se reproduit.",
    "es": "Motivo: {{0}}\n\nComunica este texto si el error se repite.",
    "de": "Grund: {{0}}\n\nMelde diesen Text, wenn der Fehler erneut auftritt."
  },
  "Это действие нельзя отменить. Проверьте сохранённую резервную копию перед удалением.": {
    "en": "This cannot be undone. Check your saved backup before deleting.",
    "fr": "Cette action est irréversible. Vérifiez votre sauvegarde avant de supprimer.",
    "es": "Esta acción no se puede deshacer. Comprueba la copia guardada antes de eliminar.",
    "de": "Dies kann nicht rückgängig gemacht werden. Prüfe die gespeicherte Sicherung vor dem Löschen."
  },
  "Восстановить резервную копию?": {
    "en": "Restore the backup?",
    "fr": "Restaurer la sauvegarde ?",
    "es": "¿Restaurar la copia?",
    "de": "Sicherung wiederherstellen?"
  },
  "Текущие записи будут заменены данными из выбранного файла.": {
    "en": "Current records will be replaced with data from the selected file.",
    "fr": "Les mesures actuelles seront remplacées par les données du fichier choisi.",
    "es": "Los registros actuales se sustituirán por los datos del archivo seleccionado.",
    "de": "Die aktuellen Einträge werden durch Daten aus der ausgewählten Datei ersetzt."
  },
  "Восстановлено записей: {{0}}. Периоды в этой копии не сохранены — текущие оставлены как есть.": {
    "en": "Restored records: {{0}}. This backup has no periods; existing periods were preserved.",
    "fr": "Mesures restaurées : {{0}}. Cette sauvegarde ne contient pas de périodes ; les périodes actuelles ont été conservées.",
    "es": "Registros restaurados: {{0}}. Esta copia no tiene períodos; se han conservado los actuales.",
    "de": "Wiederhergestellte Einträge: {{0}}. Diese Sicherung enthält keine Zeiträume; bestehende Zeiträume wurden erhalten."
  },
  "Восстановлено записей: {{0}}, периодов: {{1}}.": {
    "en": "Restored records: {{0}}, periods: {{1}}.",
    "fr": "Mesures restaurées : {{0}}, périodes : {{1}}.",
    "es": "Registros restaurados: {{0}}, períodos: {{1}}.",
    "de": "Wiederhergestellte Einträge: {{0}}, Zeiträume: {{1}}."
  },
  "Файл не подходит": {
    "en": "Unsupported file",
    "fr": "Fichier incompatible",
    "es": "Archivo no compatible",
    "de": "Ungeeignete Datei"
  },
  "Не удалось прочитать выбранную резервную копию.": {
    "en": "Could not read the selected backup.",
    "fr": "Lecture de la sauvegarde choisie impossible.",
    "es": "No se pudo leer la copia seleccionada.",
    "de": "Die ausgewählte Sicherung konnte nicht gelesen werden."
  },
  "ДАННЫЕ И ПРИЛОЖЕНИЕ": {
    "en": "DATA AND APP",
    "fr": "DONNÉES ET APPLICATION",
    "es": "DATOS Y APLICACIÓN",
    "de": "DATEN UND APP"
  },
  "Все данные хранятся только на этом устройстве": {
    "en": "All data is stored only on this device",
    "fr": "Toutes les données sont stockées uniquement sur cet appareil",
    "es": "Todos los datos se guardan solo en este dispositivo",
    "de": "Alle Daten werden ausschließlich auf diesem Gerät gespeichert"
  },
  "Автоматическая копия выключена": {
    "en": "Automatic backup is off",
    "fr": "Sauvegarde automatique désactivée",
    "es": "Copia automática desactivada",
    "de": "Automatische Sicherung deaktiviert"
  },
  "Автоматическое копирование выключено": {
    "en": "Automatic backup is off",
    "fr": "Sauvegarde automatique désactivée",
    "es": "Copia automática desactivada",
    "de": "Automatische Sicherung deaktiviert"
  },
  "Один JSON-файл. Повторные открытия в течение 24 часов его не обновляют.": {
    "en": "One JSON file. Opening again within 24 hours does not update it.",
    "fr": "Un seul fichier JSON. Une nouvelle ouverture dans les 24 heures ne le met pas à jour.",
    "es": "Un solo archivo JSON. Abrir de nuevo en 24 horas no lo actualiza.",
    "de": "Eine JSON-Datei. Erneutes Öffnen innerhalb von 24 Stunden aktualisiert sie nicht."
  },
  "Готовая таблица .xlsx для Excel, Numbers или врача": {
    "en": "A ready-to-use .xlsx table for Excel, Numbers or your doctor",
    "fr": "Un tableau .xlsx prêt pour Excel, Numbers ou votre médecin",
    "es": "Una tabla .xlsx lista para Excel, Numbers o tu médico",
    "de": "Eine fertige .xlsx-Tabelle für Excel, Numbers oder deinen Arzt"
  },
  "Приватность по умолчанию": {
    "en": "Privacy by default",
    "fr": "Confidentialité par défaut",
    "es": "Privacidad por defecto",
    "de": "Datenschutz von Anfang an"
  },
  "В этой версии нет аккаунта, облака или интеграций. Измерения не покидают телефон, пока ты сам не экспортируешь файл.": {
    "en": "This version has no account, cloud or integrations. Measurements stay on your phone until you export a file.",
    "fr": "Cette version n'a ni compte, ni cloud, ni intégrations. Les mesures restent sur votre téléphone jusqu'à l'export d'un fichier.",
    "es": "Esta versión no tiene cuenta, nube ni integraciones. Las mediciones permanecen en el teléfono hasta que exportes un archivo.",
    "de": "Diese Version hat kein Konto, keine Cloud und keine Integrationen. Messungen bleiben auf deinem Telefon, bis du eine Datei exportierst."
  },
  "Давление · версия 0.7.1": {
    "en": "Blood pressure · version 0.7.1",
    "fr": "Tension · version 0.7.1",
    "es": "Presión arterial · versión 0.7.1",
    "de": "Blutdruck · Version 0.7.1"
  },
  "Закрыть резервную копию": {
    "en": "Close backup",
    "fr": "Fermer la sauvegarde",
    "es": "Cerrar copia",
    "de": "Sicherung schließen"
  },
  "Копии пока нет. Она появится при открытии приложения с сохранёнными измерениями и включённой автоматической копией.": {
    "en": "No backup yet. It will be created when you open the app with saved measurements and automatic backup enabled.",
    "fr": "Aucune sauvegarde pour le moment. Elle sera créée à l'ouverture de l'application avec des mesures enregistrées et la sauvegarde automatique activée.",
    "es": "Aún no hay copia. Se creará al abrir la aplicación con mediciones guardadas y la copia automática activada.",
    "de": "Noch keine Sicherung. Sie wird beim Öffnen der App mit gespeicherten Messungen und aktivierter automatischer Sicherung erstellt."
  },
  "Все записи: {{0}}": {
    "en": "All records: {{0}}",
    "fr": "Toutes les mesures : {{0}}",
    "es": "Todos los registros: {{0}}",
    "de": "Alle Einträge: {{0}}"
  },
  "{{0}} · записей: {{1}} из {{2}}": {
    "en": "{{0}} · records: {{1}} of {{2}}",
    "fr": "{{0}} · mesures : {{1}} sur {{2}}",
    "es": "{{0}} · registros: {{1}} de {{2}}",
    "de": "{{0}} · Einträge: {{1}} von {{2}}"
  },
  "Динамика давления": {
    "en": "Blood pressure trend",
    "fr": "Évolution de la tension",
    "es": "Evolución de la presión",
    "de": "Blutdruckverlauf"
  },
  "Динамика пульса": {
    "en": "Pulse trend",
    "fr": "Évolution du pouls",
    "es": "Evolución del pulso",
    "de": "Pulsverlauf"
  },
  "Удары в минуту": {
    "en": "Beats per minute",
    "fr": "Battements par minute",
    "es": "Latidos por minuto",
    "de": "Schläge pro Minute"
  },
  "Динамика самочувствия": {
    "en": "Wellbeing trend",
    "fr": "Évolution du bien-être",
    "es": "Evolución del bienestar",
    "de": "Verlauf des Wohlbefindens"
  },
  "Оценка от 1 до 10": {
    "en": "Score from 1 to 10",
    "fr": "Note de 1 à 10",
    "es": "Puntuación de 1 a 10",
    "de": "Bewertung von 1 bis 10"
  },
  "По периодам": {
    "en": "By period",
    "fr": "Par période",
    "es": "Por período",
    "de": "Nach Zeitraum"
  },
  "Создай период в разделе «Периоды».": {
    "en": "Create a period in the Periods section.",
    "fr": "Créez une période dans la section Périodes.",
    "es": "Crea un período en la sección Períodos.",
    "de": "Erstelle einen Zeitraum im Bereich Zeiträume."
  },
  "{{0}} · {{1}} из {{2}} записей": {
    "en": "{{0}} · {{1}} of {{2}} records",
    "fr": "{{0}} · {{1}} mesures sur {{2}}",
    "es": "{{0}} · {{1}} de {{2}} registros",
    "de": "{{0}} · {{1}} von {{2}} Einträgen"
  },
  "{{0}} · весь период · {{1}} записей": {
    "en": "{{0}} · entire period · {{1}} records",
    "fr": "{{0}} · période entière · {{1}} mesures",
    "es": "{{0}} · período completo · {{1}} registros",
    "de": "{{0}} · gesamter Zeitraum · {{1}} Einträge"
  },
  "Нет периодов для расчёта": {
    "en": "No periods to calculate",
    "fr": "Aucune période pour le calcul",
    "es": "No hay períodos para calcular",
    "de": "Keine Zeiträume für die Berechnung"
  },
  "из": {
    "en": "of",
    "fr": "sur",
    "es": "de",
    "de": "von"
  },
  "Возможно, запись уже была удалена.": {
    "en": "The record may already have been deleted.",
    "fr": "La mesure a peut-être déjà été supprimée.",
    "es": "Es posible que el registro ya se haya eliminado.",
    "de": "Der Eintrag wurde möglicherweise bereits gelöscht."
  },
  "Серия измерений": {
    "en": "Measurement series",
    "fr": "Série de mesures",
    "es": "Serie de mediciones",
    "de": "Messserie"
  },
  "Оценка во время измерения": {
    "en": "Score at the time of measurement",
    "fr": "Note au moment de la mesure",
    "es": "Puntuación al medir",
    "de": "Bewertung zum Messzeitpunkt"
  },
  "Добавить": {
    "en": "Add",
    "fr": "Ajouter",
    "es": "Añadir",
    "de": "Hinzufügen"
  },
  "Попробуйте ещё раз.": {
    "en": "Try again.",
    "fr": "Réessayez.",
    "es": "Inténtalo de nuevo.",
    "de": "Versuche es erneut."
  },
  "Возможно, он уже удалён.": {
    "en": "It may already have been deleted.",
    "fr": "Elle a peut-être déjà été supprimée.",
    "es": "Es posible que ya se haya eliminado.",
    "de": "Er wurde möglicherweise bereits gelöscht."
  },
  "Завершаем…": {
    "en": "Ending…",
    "fr": "Finalisation…",
    "es": "Finalizando…",
    "de": "Wird beendet…"
  },
  "Дата завершения сохранена": {
    "en": "End date saved",
    "fr": "Date de fin enregistrée",
    "es": "Fecha de finalización guardada",
    "de": "Enddatum gespeichert"
  },
  "данные": {
    "en": "data",
    "fr": "les données",
    "es": "los datos",
    "de": "Daten"
  },
  "Загружаем {{0}}…": {
    "en": "Loading {{0}}…",
    "fr": "Chargement de {{0}}…",
    "es": "Cargando {{0}}…",
    "de": "{{0}} werden geladen…"
  },
  "Не удалось загрузить {{0}}.": {
    "en": "Could not load {{0}}.",
    "fr": "Impossible de charger {{0}}.",
    "es": "No se pudieron cargar {{0}}.",
    "de": "{{0}} konnten nicht geladen werden."
  },
  "Повторить": {
    "en": "Retry",
    "fr": "Réessayer",
    "es": "Reintentar",
    "de": "Erneut versuchen"
  },
  "С {{0}}": {
    "en": "From {{0}}",
    "fr": "À partir du {{0}}",
    "es": "Desde {{0}}",
    "de": "Ab {{0}}"
  },
  "По {{0}}": {
    "en": "Until {{0}}",
    "fr": "Jusqu'au {{0}}",
    "es": "Hasta {{0}}",
    "de": "Bis {{0}}"
  },
  "Все даты": {
    "en": "All dates",
    "fr": "Toutes les dates",
    "es": "Todas las fechas",
    "de": "Alle Daten"
  },
  "Сортировать по": {
    "en": "Sort by",
    "fr": "Trier par",
    "es": "Ordenar por",
    "de": "Sortieren nach"
  },
  "Показывать сначала": {
    "en": "Show first",
    "fr": "Afficher d'abord",
    "es": "Mostrar primero",
    "de": "Zuerst anzeigen"
  },
  "Закрыть фильтры": {
    "en": "Close filters",
    "fr": "Fermer les filtres",
    "es": "Cerrar filtros",
    "de": "Filter schließen"
  },
  "Период и порядок записей": {
    "en": "Date range and record order",
    "fr": "Intervalle et ordre des mesures",
    "es": "Intervalo y orden de registros",
    "de": "Zeitraum und Reihenfolge der Einträge"
  },
  "Параметры": {
    "en": "Options",
    "fr": "Paramètres",
    "es": "Opciones",
    "de": "Optionen"
  },
  "С даты": {
    "en": "From date",
    "fr": "À partir du",
    "es": "Desde la fecha",
    "de": "Ab Datum"
  },
  "Любая дата": {
    "en": "Any date",
    "fr": "Toute date",
    "es": "Cualquier fecha",
    "de": "Beliebiges Datum"
  },
  "По дату включительно": {
    "en": "Up to and including",
    "fr": "Jusqu'au inclus",
    "es": "Hasta la fecha incluida",
    "de": "Bis einschließlich"
  },
  "Очистить период": {
    "en": "Clear date range",
    "fr": "Effacer l'intervalle",
    "es": "Borrar intervalo",
    "de": "Zeitraum löschen"
  },
  "Выбрать дату": {
    "en": "Select date",
    "fr": "Choisir une date",
    "es": "Elegir fecha",
    "de": "Datum wählen"
  },
  "Открывает подробности измерения": {
    "en": "Opens measurement details",
    "fr": "Ouvre les détails de la mesure",
    "es": "Abre los detalles de la medición",
    "de": "Öffnet die Messungsdetails"
  },
  "Среднее из": {
    "en": "Average of",
    "fr": "Moyenne de",
    "es": "Media de",
    "de": "Mittelwert aus"
  },
  "Проверь давление: систолическое должно быть выше диастолического.": {
    "en": "Check blood pressure: systolic pressure must exceed diastolic pressure.",
    "fr": "Vérifiez la tension : la systolique doit dépasser la diastolique.",
    "es": "Comprueba la presión: la sistólica debe superar la diastólica.",
    "de": "Prüfe den Blutdruck: der systolische muss höher als der diastolische sein."
  },
  "Дата и время: {{0}}": {
    "en": "Date and time: {{0}}",
    "fr": "Date et heure : {{0}}",
    "es": "Fecha y hora: {{0}}",
    "de": "Datum und Uhrzeit: {{0}}"
  },
  "Можно изменить дату и время этого замера": {
    "en": "You can change this reading's date and time",
    "fr": "Vous pouvez modifier la date et l'heure de ce relevé",
    "es": "Puedes cambiar la fecha y hora de esta medición",
    "de": "Du kannst Datum und Uhrzeit dieser Messung ändern"
  },
  "Далее": {
    "en": "Next",
    "fr": "Suivant",
    "es": "Siguiente",
    "de": "Weiter"
  },
  "Закрыть выбор даты": {
    "en": "Close date picker",
    "fr": "Fermer le sélecteur de date",
    "es": "Cerrar selector de fecha",
    "de": "Datumsauswahl schließen"
  },
  "Изменить дату": {
    "en": "Change date",
    "fr": "Modifier la date",
    "es": "Cambiar fecha",
    "de": "Datum ändern"
  },
  "Изменить время": {
    "en": "Change time",
    "fr": "Modifier l'heure",
    "es": "Cambiar hora",
    "de": "Uhrzeit ändern"
  },
  "Подставить текущее время": {
    "en": "Use current time",
    "fr": "Utiliser l'heure actuelle",
    "es": "Usar la hora actual",
    "de": "Aktuelle Uhrzeit verwenden"
  },
  "Допустимо:": {
    "en": "Allowed:",
    "fr": "Autorisé :",
    "es": "Permitido:",
    "de": "Zulässig:"
  },
  "Удалить цифру": {
    "en": "Delete digit",
    "fr": "Effacer un chiffre",
    "es": "Borrar dígito",
    "de": "Ziffer löschen"
  },
  "Добавьте измерение, чтобы увидеть динамику": {
    "en": "Add a measurement to see the trend",
    "fr": "Ajoutez une mesure pour voir l'évolution",
    "es": "Añade una medición para ver la evolución",
    "de": "Füge eine Messung hinzu, um den Verlauf zu sehen"
  },
  "График: {{0}}": {
    "en": "Chart: {{0}}",
    "fr": "Graphique : {{0}}",
    "es": "Gráfico: {{0}}",
    "de": "Diagramm: {{0}}"
  },
  "Не удалось загрузить настройки. Повторить": {
    "en": "Could not load settings. Retry",
    "fr": "Chargement des réglages impossible. Réessayer",
    "es": "No se pudieron cargar los ajustes. Reintentar",
    "de": "Einstellungen konnten nicht geladen werden. Erneut versuchen"
  },
  "Систолическое давление": {
    "en": "Systolic pressure",
    "fr": "Tension systolique",
    "es": "Presión sistólica",
    "de": "Systolischer Blutdruck"
  },
  "Диастолическое давление": {
    "en": "Diastolic pressure",
    "fr": "Tension diastolique",
    "es": "Presión diastólica",
    "de": "Diastolischer Blutdruck"
  },
  "Ни кофе, ни энергетиков, ни алкоголя": {
    "en": "No coffee, energy drinks or alcohol",
    "fr": "Ni café, ni boissons énergisantes, ni alcool",
    "es": "Sin café, bebidas energéticas ni alcohol",
    "de": "Kein Kaffee, keine Energydrinks, kein Alkohol"
  },
  "Кофе без остального": {
    "en": "Coffee only",
    "fr": "Café uniquement",
    "es": "Solo café",
    "de": "Nur Kaffee"
  },
  "Энергетические напитки": {
    "en": "Energy drinks",
    "fr": "Boissons énergisantes",
    "es": "Bebidas energéticas",
    "de": "Energydrinks"
  },
  "Спиртное без остального": {
    "en": "Alcohol only",
    "fr": "Alcool uniquement",
    "es": "Solo alcohol",
    "de": "Nur Alkohol"
  },
  "Кофе, энергетик и алкоголь": {
    "en": "Coffee, energy drinks and alcohol",
    "fr": "Café, boissons énergisantes et alcool",
    "es": "Café, bebidas energéticas y alcohol",
    "de": "Kaffee, Energydrinks und Alkohol"
  },
  "Неделя": {
    "en": "Week",
    "fr": "Semaine",
    "es": "Semana",
    "de": "Woche"
  },
  "Месяц": {
    "en": "Month",
    "fr": "Mois",
    "es": "Mes",
    "de": "Monat"
  },
  "3 месяца": {
    "en": "3 months",
    "fr": "3 mois",
    "es": "3 meses",
    "de": "3 Monate"
  },
  "без изменений": {
    "en": "no change",
    "fr": "sans changement",
    "es": "sin cambios",
    "de": "unverändert"
  },
  "От нового к старому": {
    "en": "Newest first",
    "fr": "Plus récentes d’abord",
    "es": "Más recientes primero",
    "de": "Neueste zuerst"
  },
  "От старого к новому": {
    "en": "Oldest first",
    "fr": "Plus anciennes d’abord",
    "es": "Más antiguos primero",
    "de": "Älteste zuerst"
  },
  "Систолическое: сначала наибольшее": {
    "en": "Systolic: highest first",
    "fr": "Systolique : plus élevée d’abord",
    "es": "Sistólica: más alta primero",
    "de": "Systolisch: höchste zuerst"
  },
  "Систолическое: сначала наименьшее": {
    "en": "Systolic: lowest first",
    "fr": "Systolique : plus basse d’abord",
    "es": "Sistólica: más baja primero",
    "de": "Systolisch: niedrigste zuerst"
  },
  "Диастолическое: сначала наибольшее": {
    "en": "Diastolic: highest first",
    "fr": "Diastolique : plus élevée d’abord",
    "es": "Diastólica: más alta primero",
    "de": "Diastolisch: höchste zuerst"
  },
  "Диастолическое: сначала наименьшее": {
    "en": "Diastolic: lowest first",
    "fr": "Diastolique : plus basse d’abord",
    "es": "Diastólica: más baja primero",
    "de": "Diastolisch: niedrigste zuerst"
  },
  "Пульс: сначала наибольший": {
    "en": "Pulse: highest first",
    "fr": "Pouls : plus élevé d’abord",
    "es": "Pulso: más alto primero",
    "de": "Puls: höchster zuerst"
  },
  "Пульс: сначала наименьший": {
    "en": "Pulse: lowest first",
    "fr": "Pouls : plus bas d’abord",
    "es": "Pulso: más bajo primero",
    "de": "Puls: niedrigster zuerst"
  },
  "Даты пересекаются с другим периодом. Измени начало или окончание периода.": {
    "en": "Dates overlap another period. Change its start or end.",
    "fr": "Les dates chevauchent une autre période. Modifiez le début ou la fin.",
    "es": "Las fechas se solapan con otro período. Cambia el inicio o el final.",
    "de": "Die Daten überschneiden sich mit einem anderen Zeitraum. Ändere Beginn oder Ende."
  },
  "Системное сохранение и просмотр папки доступны в сборке приложения на телефоне.": {
    "en": "System saving and folder browsing are available in the installed phone app.",
    "fr": "L’enregistrement système et l’ouverture du dossier sont disponibles dans l’application installée sur le téléphone.",
    "es": "El guardado del sistema y la apertura de carpetas están disponibles en la aplicación instalada en el teléfono.",
    "de": "Systemspeicherung und Ordneransicht sind in der installierten Telefon-App verfügbar."
  },
  "Не удалось прочитать папку копии. Выберите её снова.": {
    "en": "Could not read the backup folder. Select it again.",
    "fr": "Lecture du dossier de sauvegarde impossible. Sélectionnez-le à nouveau.",
    "es": "No se pudo leer la carpeta de copia. Selecciónala de nuevo.",
    "de": "Der Sicherungsordner konnte nicht gelesen werden. Wähle ihn erneut aus."
  },
  "Выбор постоянной папки на iPhone доступен в сборке приложения. В Expo Go используйте папку по умолчанию.": {
    "en": "Persistent folder selection on iPhone is available in the installed app. Use the default folder in Expo Go.",
    "fr": "Le choix d’un dossier permanent sur iPhone est disponible dans l’application installée. Utilisez le dossier par défaut dans Expo Go.",
    "es": "La selección de carpeta permanente en iPhone está disponible en la aplicación instalada. Usa la carpeta predeterminada en Expo Go.",
    "de": "Die Auswahl eines dauerhaften Ordners auf dem iPhone ist in der installierten App verfügbar. Verwende in Expo Go den Standardordner."
  },
  "Выбор папки доступен в приложении на телефоне.": {
    "en": "Folder selection is available in the phone app.",
    "fr": "Le choix du dossier est disponible dans l’application mobile.",
    "es": "La selección de carpeta está disponible en la aplicación del teléfono.",
    "de": "Die Ordnerauswahl ist in der Telefon-App verfügbar."
  },
  "Не удалось прочитать прежнюю копию.": {
    "en": "Could not read the previous backup.",
    "fr": "Lecture de la sauvegarde précédente impossible.",
    "es": "No se pudo leer la copia anterior.",
    "de": "Die vorherige Sicherung konnte nicht gelesen werden."
  },
  "Не удалось открыть сохранение файла.": {
    "en": "Could not open the save dialog.",
    "fr": "Ouverture de l’enregistrement impossible.",
    "es": "No se pudo abrir el diálogo de guardado.",
    "de": "Der Speicherdialog konnte nicht geöffnet werden."
  },
  "Не удалось открыть выбор папки.": {
    "en": "Could not open the folder picker.",
    "fr": "Ouverture du choix de dossier impossible.",
    "es": "No se pudo abrir el selector de carpeta.",
    "de": "Die Ordnerauswahl konnte nicht geöffnet werden."
  },
  "Папка недоступна. Выберите её снова в настройках.": {
    "en": "Folder unavailable. Select it again in settings.",
    "fr": "Dossier indisponible. Sélectionnez-le à nouveau dans les réglages.",
    "es": "Carpeta no disponible. Selecciónala de nuevo en los ajustes.",
    "de": "Ordner nicht verfügbar. Wähle ihn erneut in den Einstellungen aus."
  },
  "Некорректный файл экспорта.": {
    "en": "Invalid export file.",
    "fr": "Fichier d’export invalide.",
    "es": "Archivo de exportación no válido.",
    "de": "Ungültige Exportdatei."
  },
  "Не удалось сохранить файл.": {
    "en": "Could not save the file.",
    "fr": "Enregistrement du fichier impossible.",
    "es": "No se pudo guardar el archivo.",
    "de": "Die Datei konnte nicht gespeichert werden."
  }
};
  const nativeEntries = {
    'Средние и разница': ['Means and difference', 'Moyennes et différence', 'Promedios y diferencia', 'Mittelwerte und Differenz'],
    'Медиана и разница': ['Median and difference', 'Médiane et différence', 'Mediana y diferencia', 'Median und Differenz'],
    'История первого': ['First history', 'Historique du premier', 'Historial del primero', 'Verlauf des ersten'],
    'История второго': ['Second history', 'Historique du second', 'Historial del segundo', 'Verlauf des zweiten'],
    'Не удалось удалить измерение.': ['Could not delete the measurement.', 'Impossible de supprimer la mesure.', 'No se pudo eliminar la medición.', 'Messung konnte nicht gelöscht werden.'],
    'Удалить черновик?': ['Delete draft?', 'Supprimer le brouillon ?', '¿Eliminar el borrador?', 'Entwurf löschen?'],
    'Введённые показатели и заметка будут удалены.': ['Entered readings and the note will be deleted.', 'Les mesures saisies et la note seront supprimées.', 'Se eliminarán las mediciones introducidas y la nota.', 'Die eingegebenen Werte und die Notiz werden gelöscht.'],
    'Удалить замер': ['Delete reading', 'Supprimer la mesure', 'Eliminar medición', 'Messung löschen'],
    'Нет подходящих записей': ['No matching entries', 'Aucune entrée correspondante', 'No hay registros coincidentes', 'Keine passenden Einträge'],
    'Показать ещё': ['Show more', 'Afficher plus', 'Mostrar más', 'Mehr anzeigen'],
    'Начало должно быть не позже завершения.': ['The start must not be after the end.', 'Le début ne doit pas être après la fin.', 'El inicio no debe ser posterior al final.', 'Der Beginn darf nicht nach dem Ende liegen.'],
    'Показать {{0}}': ['Show {{0}}', 'Afficher {{0}}', 'Mostrar {{0}}', '{{0}} anzeigen'],
    'Дополнительные фильтры': ['More filters', 'Autres filtres', 'Más filtros', 'Weitere Filter'],
    'Только с заметкой': ['With a note only', 'Avec une note uniquement', 'Solo con nota', 'Nur mit Notiz'],
    'Удалить измерение?': ['Delete measurement?', 'Supprimer la mesure ?', '¿Eliminar la medición?', 'Messung löschen?'],
    'Действие нельзя отменить.': ['This cannot be undone.', 'Cette action est irréversible.', 'Esta acción no se puede deshacer.', 'Diese Aktion kann nicht rückgängig gemacht werden.'],
    'Добавьте заметку': ['Add a note', 'Ajouter une note', 'Añadir una nota', 'Notiz hinzufügen'],
    'При обновлении привычек или образа жизни': ['When changing habits or lifestyle', 'Lors d’un changement d’habitudes ou de mode de vie', 'Al cambiar hábitos o estilo de vida', 'Bei Änderungen der Gewohnheiten oder des Lebensstils'],
    'Измерения останутся в дневнике.': ['Measurements will remain in the diary.', 'Les mesures resteront dans le journal.', 'Las mediciones permanecerán en el diario.', 'Die Messungen bleiben im Tagebuch.'],
    'Выбрать даты': ['Choose dates', 'Choisir les dates', 'Elegir fechas', 'Daten wählen'],
    'Выбрать период': ['Choose period', 'Choisir la période', 'Elegir período', 'Zeitraum wählen'],
    'Разница:': ['Difference:', 'Différence :', 'Diferencia:', 'Differenz:'],
    'Выбор периода или диапазона': ['Choose a period or date range', 'Choisir une période ou une plage de dates', 'Elegir un período o intervalo de fechas', 'Zeitraum oder Datumsbereich wählen'],
    'Черновик не сохранён. Попробуйте ещё раз.': ['Draft not saved. Please try again.', 'Brouillon non enregistré. Réessayez.', 'No se guardó el borrador. Inténtalo de nuevo.', 'Entwurf nicht gespeichert. Bitte erneut versuchen.'],
    'Не удалось сохранить измерение.': ['Could not save the measurement.', 'Impossible d’enregistrer la mesure.', 'No se pudo guardar la medición.', 'Messung konnte nicht gespeichert werden.'],
    'Не удалось сохранить период.': ['Could not save the period.', 'Impossible d’enregistrer la période.', 'No se pudo guardar el período.', 'Zeitraum konnte nicht gespeichert werden.']
  };
  for (const [key, values] of Object.entries(nativeEntries)) catalog[key] = Object.fromEntries(['en','fr','es','de'].map((code,index) => [code,values[index]]));
  if(typeof module==='object'&&module.exports)module.exports=catalog;else root.DiaryTranslations=catalog;
})(typeof window==='object'?window:globalThis);
