import { Transaction } from "./types";

export interface MonthlySummary {
  yearMonth: string;
  income: number;
  expenses: number;
  net: number;
}

export function groupByMonth(transactions: Transaction[]): MonthlySummary[] {
  const map = new Map<string, MonthlySummary>();

  for (const t of transactions) {
    const ym = t.date.slice(0, 7); // "2026-04"
    if (!map.has(ym)) {
      map.set(ym, { yearMonth: ym, income: 0, expenses: 0, net: 0 });
    }
    const entry = map.get(ym)!;
    if (t.type === "income") entry.income += t.amount;
    else entry.expenses += t.amount;
    entry.net = entry.income - entry.expenses;
  }

  return Array.from(map.values()).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

export function groupByCategory(
  transactions: Transaction[],
  type: "income" | "expense"
): { category: string; total: number }[] {
  const map = new Map<string, number>();
  for (const t of transactions.filter((t) => t.type === type)) {
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
}

export function ytdSummary(transactions: Transaction[], year: number) {
  const filtered = transactions.filter((t) => t.date.startsWith(String(year)));
  const income = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenses = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  return { income, expenses, net: income - expenses };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
