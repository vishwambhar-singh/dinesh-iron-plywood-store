import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

type ExportFormat = "json" | "csv" | "xlsx";

export const handleExport = (
  data: any[],
  format: ExportFormat = "xlsx",
  fileName: string = "export",
) => {
  if (!data || data.length === 0) return;

  switch (format) {
    case "json": {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      saveAs(blob, `${fileName}.json`);
      break;
    }

    case "csv": {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `${fileName}.csv`);
      break;
    }

    case "xlsx": {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(blob, `${fileName}.xlsx`);
      break;
    }
  }
};
