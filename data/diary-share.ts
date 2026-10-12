import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as XLSX from "@e965/xlsx";
import * as M from "../design-lab/model";
import { tr } from "@/localization";
import { clarityWorkbook } from "./clarity-export";

export type ExportFormat = "xlsx" | "json";

/** Keep shared files alive while another application reads them asynchronously. */
export async function shareDiary(state: M.State, format: ExportFormat) {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Поделиться файлом недоступно на этом устройстве.");
  const now = Date.now();
  for (const item of Paths.cache.list()) {
    if (!(item instanceof File)) continue;
    const saved = /^davlenie-export-(\d{4}-\d{2}-\d{2})(?:-(\d+))?\.(?:xlsx|json)$/.exec(item.name);
    if (!saved) continue;
    const at = saved[2] ? Number(saved[2]) : Date.parse(saved[1] + "T00:00:00Z");
    if (now - at > 24 * 60 * 60 * 1000) {
      try { item.delete(); } catch { /* Cache cleanup must not block a new export. */ }
    }
  }
  const date = new Date(now).toISOString().slice(0, 10);
  const file = new File(Paths.cache, `davlenie-export-${date}-${now}.${format}`);
  if (format === "json") file.write(JSON.stringify(M.backup(state), null, 2));
  else file.write(new Uint8Array(XLSX.write(clarityWorkbook(state), { bookType: "xlsx", type: "array", compression: true })));
  await Sharing.shareAsync(file.uri, {
    mimeType: format === "json" ? "application/json" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    UTI: format === "json" ? "public.json" : "org.openxmlformats.spreadsheetml.sheet",
    dialogTitle: tr(format === "json" ? "Экспорт JSON" : "Экспорт Excel"),
  });
}
