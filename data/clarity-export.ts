import * as XLSX from "@e965/xlsx";
import * as M from "../design-lab/model";
import { tr } from "@/localization";

/** Excel contains the same unrounded values and every matching period as the prototype. */
export function clarityWorkbook(state: Pick<M.State, "sessions" | "phases">) {
  const sessions = M.filter(state.sessions);
  const book = XLSX.utils.book_new();
  const pressure = [
    "Верхнее, мм рт. ст.",
    "Нижнее, мм рт. ст.",
    "Пульс, уд/мин",
  ].map((text) => tr(text));
  function sheet(
    name: string,
    rows: (string | number | Date)[][],
    widths: number[],
    dateColumns: string[],
  ) {
    const result = XLSX.utils.aoa_to_sheet(rows, { cellDates: true });
    result["!cols"] = widths.map((wch) => ({ wch }));
    result["!autofilter"] = { ref: result["!ref"]! };
    for (let row = 2; row <= rows.length; row++)
      for (const column of dateColumns) {
        const cell = result[column + row];
        if (cell?.t === "d") cell.z = "dd.mm.yyyy hh:mm";
      }
    XLSX.utils.book_append_sheet(book, result, tr(name));
  }
  sheet(
    "Измерения",
    [
      [
        tr("Дата и время"),
        ...pressure,
        tr("Самочувствие, 1–10"),
        tr("Тип"),
        tr("Замеров"),
        tr("Отметки"),
        tr("Заметка"),
        tr("Периоды"),
      ],
      ...sessions.map((s) => {
        const v = M.summary(s).averages;
        return [
          new Date(s.measuredAt),
          v.systolic,
          v.diastolic,
          v.pulse,
          s.wellbeing,
          tr(s.mode === "series" ? "Серия" : "Один замер"),
          s.readings.length,
          s.tags.map((tag) => tr(tag)).join("; "),
          s.note,
          M.phasesFor(s, state.phases)
            .map((p) => p.title)
            .join("; "),
        ];
      }),
    ],
    [22, 23, 23, 19, 21, 18, 12, 32, 45, 36],
    ["A"],
  );
  sheet(
    "Замеры",
    [
      [tr("Номер записи"), tr("Замер"), tr("Дата и время"), ...pressure],
      ...sessions.flatMap((s) =>
        s.readings.map((r, i) => [
          s.id,
          i + 1,
          new Date(r.measuredAt),
          r.systolic,
          r.diastolic,
          r.pulse,
        ]),
      ),
    ],
    [14, 12, 22, 23, 23, 19],
    ["C"],
  );
  sheet(
    "Периоды",
    [
      [
        "Название",
        "Значок",
        "Цвет",
        "Начало",
        "Конец",
        "Заметка",
        "Записей",
        ...pressure,
        "Самочувствие",
      ].map((text) => tr(text)),
      ...state.phases.map((p) => {
        const appearance = M.phaseAppearance(p),
          values = M.stats(state.sessions.filter((s) => M.inside(s, p)));
        return [
          p.title,
          tr(
            M.PHASE_ICONS.find((i) => i.icon === appearance.icon)?.label ||
              appearance.icon,
          ),
          appearance.color,
          new Date(p.startedAt),
          p.endedAt ? new Date(p.endedAt) : tr("Идёт сейчас"),
          p.note,
          values.count,
          ...(["systolic", "diastolic", "pulse", "wellbeing"] as const).map(
            (key) => (values.count ? values.averages[key] : ""),
          ),
        ];
      }),
    ],
    [26, 18, 14, 22, 22, 45, 12, 23, 23, 19, 18],
    ["D", "E"],
  );
  book.Props = {
    Title: tr("Дневник артериального давления"),
    Author: tr("Давление"),
  };
  return book;
}
