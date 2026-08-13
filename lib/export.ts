import * as XLSX from "xlsx-js-style";
import { Transaction, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from "@/lib/types";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONEY_FMT = '$#,##0.00';

// ── Style definitions ────────────────────────────────────────────────────────
// Income/expense colors match the app's own palette (see globals.css
// --green-bg/--green-text and --red-bg/--red-text) so the report reads the
// same way the in-app transaction list does.
const S_HDR = {
  font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: "2B2B2B" } },
  alignment: { horizontal: "center" },
};
const S_SECTION = {
  font: { bold: true, sz: 11, color: { rgb: "3D2B0A" } },
  fill: { patternType: "solid", fgColor: { rgb: "EDE0C8" } },
};
const S_TOTAL_GOLD = {
  font: { bold: true, sz: 11, color: { rgb: "1A0F00" } },
  fill: { patternType: "solid", fgColor: { rgb: "C4A052" } },
  numFmt: MONEY_FMT,
};
const S_NET = {
  font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
  fill: { patternType: "solid", fgColor: { rgb: "7A5A1A" } },
  numFmt: MONEY_FMT,
};
const S_MONEY = { font: { sz: 11 }, numFmt: MONEY_FMT };

// Sheet 1: per-transaction row colors
const S_INCOME_ROW = { font: { sz: 11, color: { rgb: "1F6B4A" } }, fill: { patternType: "solid", fgColor: { rgb: "E8F5EF" } } };
const S_EXPENSE_ROW = { font: { sz: 11, color: { rgb: "A6382B" } }, fill: { patternType: "solid", fgColor: { rgb: "FBEAEA" } } };
const S_INCOME_MONEY = { ...S_INCOME_ROW, numFmt: MONEY_FMT };
const S_EXPENSE_MONEY = { ...S_EXPENSE_ROW, numFmt: MONEY_FMT };
const S_MONTH_HDR = { font: { bold: true, sz: 12, color: { rgb: "3D2B0A" } }, fill: { patternType: "solid", fgColor: { rgb: "EDE0C8" } } };
const S_SUBTOTAL_INC = { font: { bold: true, sz: 11, color: { rgb: "1F6B4A" } }, fill: { patternType: "solid", fgColor: { rgb: "D3EEE1" } }, numFmt: MONEY_FMT };
const S_SUBTOTAL_EXP = { font: { bold: true, sz: 11, color: { rgb: "A6382B" } }, fill: { patternType: "solid", fgColor: { rgb: "F6D9D9" } }, numFmt: MONEY_FMT };
const S_SUBTOTAL_INC_LABEL = { font: { bold: true, sz: 11, color: { rgb: "1F6B4A" } }, fill: { patternType: "solid", fgColor: { rgb: "D3EEE1" } }, alignment: { horizontal: "right" } };
const S_SUBTOTAL_EXP_LABEL = { font: { bold: true, sz: 11, color: { rgb: "A6382B" } }, fill: { patternType: "solid", fgColor: { rgb: "F6D9D9" } }, alignment: { horizontal: "right" } };

// ── Helpers ──────────────────────────────────────────────────────────────────
type CellStyle = Record<string, unknown>;
type RawWS = Record<string, { v: unknown; t: string; s?: CellStyle }>;

function styleCell(ws: XLSX.WorkSheet, col: number, row: number, style: CellStyle, fallback?: { v: unknown; t: string; s: CellStyle }) {
  const addr = XLSX.utils.encode_cell({ c: col, r: row });
  const raw = ws as unknown as RawWS;
  if (raw[addr]) {
    raw[addr].s = style;
  } else if (fallback) {
    raw[addr] = fallback;
  }
}

function monthStr(year: number, monthIdx: number) {
  return `${year}-${String(monthIdx + 1).padStart(2, "0")}`;
}

// Who was paid (expense) or who paid (income). Falls back through whatever
// info was actually entered on the transaction, so the column isn't blank
// just because no client record was linked:
//   1. Linked client record (clientMap)
//   2. Vendor / "Paid To" field (expenses)
//   3. Manually-typed description (last resort — often the only place this
//      info lives when there's no client on file)
function partyName(t: Transaction, clientMap: Record<string, string>): string {
  const client = t.clientId ? clientMap[t.clientId] : "";
  if (client) return client;
  if (t.type === "expense" && t.vendor) return t.vendor;
  return t.description ?? "";
}

// ── Main export function ─────────────────────────────────────────────────────
export function generateTaxReport(
  year: number,
  transactions: Transaction[],
  clientMap: Record<string, string>
): Blob {
  const wb = XLSX.utils.book_new();
  const yearStr = String(year);

  const yearTx = transactions
    .filter((t) => t.date.startsWith(yearStr))
    .sort((a, b) => a.date.localeCompare(b.date));

  // ── Sheet 1: Transactions ──────────────────────────────────────────────────
  // Grouped by month, income/expense color-coded, with an auto-summed
  // subtotal (income / expenses / net) at the end of every month, plus a
  // year-end grand total.
  type RawVal = string | number | null;
  type RowKind = "header" | "month" | "income" | "expense" | "subtotal-inc" | "subtotal-exp" | "subtotal-net" | "blank";

  const monthGroups: Record<string, Transaction[]> = {};
  for (const t of yearTx) {
    const ym = t.date.slice(0, 7);
    (monthGroups[ym] ??= []).push(t);
  }
  const sortedMonths = Object.keys(monthGroups).sort();

  const txRows: RawVal[][] = [["Date", "Type", "Category", "Description", "Client / Vendor", "Amount", "Notes"]];
  const rowKinds: RowKind[] = ["header"];

  const sumOf = (txns: Transaction[], type: "income" | "expense") =>
    txns.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  for (const ym of sortedMonths) {
    const txns = monthGroups[ym];
    const [y, m] = ym.split("-");
    txRows.push([`${MONTHS_FULL[Number(m) - 1]} ${y}`, "", "", "", "", null, ""]);
    rowKinds.push("month");

    for (const t of txns) {
      txRows.push([
        t.date,
        t.type === "income" ? "Income" : "Expense",
        t.category,
        t.description ?? "",
        partyName(t, clientMap),
        t.amount,
        t.notes ?? "",
      ]);
      rowKinds.push(t.type);
    }

    const monthInc = sumOf(txns, "income");
    const monthExp = sumOf(txns, "expense");
    txRows.push(["", "", "", "", "Total Income", monthInc, ""]);
    rowKinds.push("subtotal-inc");
    txRows.push(["", "", "", "", "Total Expenses", monthExp, ""]);
    rowKinds.push("subtotal-exp");
    txRows.push(["", "", "", "", "Net", monthInc - monthExp, ""]);
    rowKinds.push("subtotal-net");
    txRows.push(["", "", "", "", "", null, ""]);
    rowKinds.push("blank");
  }

  // Year-end grand total
  const yearInc = sumOf(yearTx, "income");
  const yearExp = sumOf(yearTx, "expense");
  txRows.push(["", "", "", "", "YEAR TOTAL INCOME", yearInc, ""]);
  rowKinds.push("subtotal-inc");
  txRows.push(["", "", "", "", "YEAR TOTAL EXPENSES", yearExp, ""]);
  rowKinds.push("subtotal-exp");
  txRows.push(["", "", "", "", "YEAR NET PROFIT / LOSS", yearInc - yearExp, ""]);
  rowKinds.push("subtotal-net");

  const ws1 = XLSX.utils.aoa_to_sheet(txRows);

  rowKinds.forEach((kind, row) => {
    if (kind === "header") {
      for (let col = 0; col < 7; col++) styleCell(ws1, col, row, S_HDR, { v: "", t: "s", s: S_HDR });
    } else if (kind === "month") {
      for (let col = 0; col < 7; col++) styleCell(ws1, col, row, S_MONTH_HDR, { v: "", t: "s", s: S_MONTH_HDR });
    } else if (kind === "income" || kind === "expense") {
      const rowStyle = kind === "income" ? S_INCOME_ROW : S_EXPENSE_ROW;
      const moneyStyle = kind === "income" ? S_INCOME_MONEY : S_EXPENSE_MONEY;
      for (let col = 0; col < 5; col++) styleCell(ws1, col, row, rowStyle, { v: "", t: "s", s: rowStyle });
      styleCell(ws1, 5, row, moneyStyle, { v: 0, t: "n", s: moneyStyle });
      styleCell(ws1, 6, row, rowStyle, { v: "", t: "s", s: rowStyle });
    } else if (kind === "subtotal-inc" || kind === "subtotal-exp") {
      const labelStyle = kind === "subtotal-inc" ? S_SUBTOTAL_INC_LABEL : S_SUBTOTAL_EXP_LABEL;
      const valueStyle = kind === "subtotal-inc" ? S_SUBTOTAL_INC : S_SUBTOTAL_EXP;
      for (let col = 0; col < 4; col++) styleCell(ws1, col, row, labelStyle, { v: "", t: "s", s: labelStyle });
      styleCell(ws1, 4, row, labelStyle, { v: "", t: "s", s: labelStyle });
      styleCell(ws1, 5, row, valueStyle, { v: 0, t: "n", s: valueStyle });
      styleCell(ws1, 6, row, labelStyle, { v: "", t: "s", s: labelStyle });
    } else if (kind === "subtotal-net") {
      for (let col = 0; col < 5; col++) styleCell(ws1, col, row, S_TOTAL_GOLD, { v: "", t: "s", s: S_TOTAL_GOLD });
      styleCell(ws1, 5, row, S_TOTAL_GOLD, { v: 0, t: "n", s: S_TOTAL_GOLD });
      styleCell(ws1, 6, row, S_TOTAL_GOLD, { v: "", t: "s", s: S_TOTAL_GOLD });
    }
  });

  ws1["!cols"] = [
    { wch: 12 }, { wch: 10 }, { wch: 35 }, { wch: 42 }, { wch: 28 }, { wch: 14 }, { wch: 40 },
  ];

  XLSX.utils.book_append_sheet(wb, ws1, "Transactions");

  // ── Sheet 2: Summary by Category ──────────────────────────────────────────
  const monthSum = (type: "income" | "expense", category: string, idx: number) =>
    yearTx
      .filter((t) => t.type === type && t.category === category && t.date.startsWith(monthStr(year, idx)))
      .reduce((s, t) => s + t.amount, 0);

  const monthTotal = (type: "income" | "expense", idx: number) =>
    yearTx
      .filter((t) => t.type === type && t.date.startsWith(monthStr(year, idx)))
      .reduce((s, t) => s + t.amount, 0);

  const incMonthTotals = MONTHS.map((_, i) => monthTotal("income", i));
  const expMonthTotals = MONTHS.map((_, i) => monthTotal("expense", i));
  const ytdInc = incMonthTotals.reduce((s, v) => s + v, 0);
  const ytdExp = expMonthTotals.reduce((s, v) => s + v, 0);

  const catRow = (type: "income" | "expense", cat: string): RawVal[] => {
    const monthly = MONTHS.map((_, i) => {
      const v = monthSum(type, cat, i);
      return v > 0 ? v : null; // null = empty cell (no $0.00)
    });
    const annual = monthly.reduce<number>((s, v) => s + (v ?? 0), 0);
    return [cat, ...monthly, annual > 0 ? annual : null];
  };

  // Build AOA — null values produce empty cells (no $0.00 shown)
  const COLS = 14; // Category + 12 months + Annual Total
  const summaryData: RawVal[][] = [
    ["Category", ...MONTHS, "Annual Total"],                              // row 0: header
    ["INCOME", ...Array<string>(COLS - 1).fill("")],                      // row 1: INCOME section
    ...INCOME_CATEGORIES.map((cat) => catRow("income", cat)),             // rows 2–10
    ["TOTAL INCOME", ...incMonthTotals, ytdInc],                          // row 11
    Array<string>(COLS).fill(""),                                          // row 12: empty
    ["EXPENSES", ...Array<string>(COLS - 1).fill("")],                    // row 13: EXPENSES section
    ...EXPENSE_CATEGORIES.map((cat) => catRow("expense", cat)),           // rows 14–32
    ["TOTAL EXPENSES", ...expMonthTotals, ytdExp],                        // row 33
    Array<string>(COLS).fill(""),                                          // row 34: empty
    ["NET PROFIT / LOSS", ...MONTHS.map((_, i) => incMonthTotals[i] - expMonthTotals[i]), ytdInc - ytdExp], // row 35
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);

  // Calculate actual row indices
  const R_HDR = 0;
  const R_INC_SECTION = 1;
  const R_INC_START = 2;
  const R_INC_END = R_INC_START + INCOME_CATEGORIES.length - 1;
  const R_TOTAL_INC = R_INC_END + 1;
  const R_EXP_SECTION = R_TOTAL_INC + 2; // +1 empty row
  const R_EXP_START = R_EXP_SECTION + 1;
  const R_EXP_END = R_EXP_START + EXPENSE_CATEGORIES.length - 1;
  const R_TOTAL_EXP = R_EXP_END + 1;
  const R_NET = R_TOTAL_EXP + 2; // +1 empty row

  // Header row
  for (let col = 0; col < COLS; col++) {
    styleCell(ws2, col, R_HDR, S_HDR, { v: "", t: "s", s: S_HDR });
  }

  // INCOME section header — force background on all cols
  for (let col = 0; col < COLS; col++) {
    styleCell(ws2, col, R_INC_SECTION, S_SECTION, { v: "", t: "s", s: S_SECTION });
  }

  // Income category rows: apply money format to value cells
  for (let row = R_INC_START; row <= R_INC_END; row++) {
    for (let col = 1; col < COLS; col++) {
      styleCell(ws2, col, row, S_MONEY);
    }
  }

  // TOTAL INCOME row — full gold background, always show values
  for (let col = 0; col < COLS; col++) {
    styleCell(ws2, col, R_TOTAL_INC, S_TOTAL_GOLD, { v: col === 0 ? "TOTAL INCOME" : 0, t: col === 0 ? "s" : "n", s: S_TOTAL_GOLD });
  }

  // EXPENSES section header
  for (let col = 0; col < COLS; col++) {
    styleCell(ws2, col, R_EXP_SECTION, S_SECTION, { v: "", t: "s", s: S_SECTION });
  }

  // Expense category rows
  for (let row = R_EXP_START; row <= R_EXP_END; row++) {
    for (let col = 1; col < COLS; col++) {
      styleCell(ws2, col, row, S_MONEY);
    }
  }

  // TOTAL EXPENSES row
  for (let col = 0; col < COLS; col++) {
    styleCell(ws2, col, R_TOTAL_EXP, S_TOTAL_GOLD, { v: col === 0 ? "TOTAL EXPENSES" : 0, t: col === 0 ? "s" : "n", s: S_TOTAL_GOLD });
  }

  // NET PROFIT / LOSS row
  for (let col = 0; col < COLS; col++) {
    styleCell(ws2, col, R_NET, S_NET, { v: col === 0 ? "NET PROFIT / LOSS" : 0, t: col === 0 ? "s" : "n", s: S_NET });
  }

  ws2["!cols"] = [
    { wch: 42 },
    ...MONTHS.map(() => ({ wch: 12 })),
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws2, "Summary by Category");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
