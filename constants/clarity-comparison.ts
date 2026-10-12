import * as M from "../design-lab/model";

function day(value: number) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Defaults follow the prototype: populated periods, or consecutive seven-day intervals. */
export function comparisonSelections(
  state: M.State,
  preferences: M.Preferences,
  now = Date.now(),
): [M.Selection, M.Selection] {
  if (preferences.compareType === "phases") {
    const populated = state.phases
      .map((phase) => ({
        phase,
        count: M.filter(state.sessions, { phase }).length,
      }))
      .sort((a, b) => b.count - a.count);
    const left = preferences.left || String(populated[0]?.phase.id || "");
    return [
      { scope: left },
      {
        scope:
          preferences.right ||
          String(
            populated.find((p) => String(p.phase.id) !== left)?.phase.id || "",
          ),
      },
    ];
  }
  const window = M.statisticsWindow(
    state.sessions,
    state.phases,
    { scope: "time", preset: "7" },
    now,
  );
  const range = (from: number, until: number): M.Selection => ({
    scope: "time",
    preset: "custom",
    from: day(from),
    to: day(until - 1),
  });
  return [
    preferences.leftDates ||
      range(window.previous!.from, window.previous!.until),
    preferences.rightDates || range(window.from!, window.until!),
  ];
}
