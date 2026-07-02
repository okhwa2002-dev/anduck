import type { FastifyReply } from "fastify";
import ExcelJS from "exceljs";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  align?: "left" | "center" | "right";
}

export interface ExcelBuildOptions {
  title?: string;
  date?: string;
}

const THIN: ExcelJS.Border = { style: "thin", color: { argb: "FF000000" } };
const ALL_BORDERS: Partial<ExcelJS.Borders> = {
  top: THIN, left: THIN, bottom: THIN, right: THIN,
};

function applyBorders(cell: ExcelJS.Cell) {
  cell.border = ALL_BORDERS;
}

export function sendExcelReply(reply: FastifyReply, buffer: Buffer, title: string) {
  const ts = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const filename = encodeURIComponent(`${title.replace(/\s/g, "")}_${ts}.xlsx`);
  reply
    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    .header("Content-Disposition", `attachment; filename*=UTF-8''${filename}`)
    .send(buffer);
}

export async function buildExcel(
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
  options: ExcelBuildOptions = {},
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  const colCount = columns.length;

  columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width ?? 16;
  });

  let nextRow = 1;

  // 1행: 타이틀 (전체 열 병합, 테두리 없음)
  if (options?.title) {
    ws.mergeCells(nextRow, 1, nextRow, colCount);
    const cell = ws.getCell(nextRow, 1);
    cell.value = options.title;
    cell.font = { bold: true, size: 14 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    ws.getRow(nextRow).height = 30;
    nextRow++;
  }

  // 2행: 작성일자 (전체 열 병합, 우측 정렬, 테두리 없음)
  if (options.date) {
    ws.mergeCells(nextRow, 1, nextRow, colCount);
    const cell = ws.getCell(nextRow, 1);
    cell.value = options.date;
    cell.alignment = { horizontal: "right", vertical: "middle" };
    ws.getRow(nextRow).height = 18;
    nextRow++;
  }

  // 헤더행 (실선 적용)
  columns.forEach((col, i) => {
    const cell = ws.getCell(nextRow, i + 1);
    cell.value = col.header;
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE9E9E9" },
    };
    applyBorders(cell);
  });
  ws.getRow(nextRow).height = 22;
  nextRow++;

  // 데이터행 (실선 적용)
  rows.forEach((row) => {
    columns.forEach((col, i) => {
      const cell = ws.getCell(nextRow, i + 1);
      cell.value = (row[col.key] ?? "") as ExcelJS.CellValue;
      cell.alignment = { vertical: "middle", horizontal: col.align ?? "center" };
      applyBorders(cell);
    });
    ws.getRow(nextRow).height = 18;
    nextRow++;
  });

  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}
