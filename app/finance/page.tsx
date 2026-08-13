"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import { Transaction, Client, INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS } from "@/lib/types";
import { groupByMonth, groupByCategory, ytdSummary, formatCurrency, currentYearMonth } from "@/lib/finance";
import { formatLocalDate, todayISO } from "@/lib/date";
import { Plus, TrendingUp, TrendingDown, Download, ChevronDown, ChevronRight, Search } from "lucide-react";
import { generateTaxReport } from "@/lib/export";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { apiFetch } from "@/lib/api";

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Transaction | null>(null);
  const [form, setForm] = useState<Partial<Transaction>>({ type: "income", date: todayISO() });
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [monthFilter, setMonthFilter] = useState<string>(currentYearMonth());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const load = async () => {
    const [t, c] = await Promise.all([
      fetch("/api/transactions").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setTransactions(t); setClients(c);
  };
  useEffect(() => {
    load();
    const stored = localStorage.getItem("teso_custom_categories");
    if (stored) setCustomCategories(JSON.parse(stored));
  }, []);

  const addCustomCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    const updated = Array.from(new Set([...customCategories, name]));
    setCustomCategories(updated);
    localStorage.setItem("teso_custom_categories", JSON.stringify(updated));
    setForm({ ...form, category: name });
    setNewCategoryName("");
    setAddingCategory(false);
  };

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const ytd = ytdSummary(transactions, 2026);
  const monthly = groupByMonth(transactions);
  const incomeByCategory = groupByCategory(transactions, "income");
  const expenseByCategory = groupByCategory(transactions, "expense");

  const filtered = transactions.filter((t) => {
    const matchType = typeFilter === "all" || t.type === typeFilter;
    const matchMonth = !monthFilter || t.date.startsWith(monthFilter);
    const matchSearch = !search || [
      t.description, t.category, t.notes, t.vendor, t.paymentMethod,
      t.clientId ? clientMap[t.clientId]?.businessName : "",
      t.date, String(t.amount),
    ].filter(Boolean).join(" ").toLowerCase().includes(search.toLowerCase());
    return matchType && matchMonth && matchSearch;
  });

  const openNew = () => { setEditTarget(null); setForm({ type: "income", date: todayISO() }); setShowForm(true); };
  const openEdit = (t: Transaction) => { setEditTarget(t); setForm(t); setShowForm(true); };

  const save = async () => {
    setLoading(true);
    try {
      if (editTarget) {
        await apiFetch(`/api/transactions/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await apiFetch("/api/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      await load();
      setShowForm(false);
    } catch (err) {
      alert(`No se pudo guardar la transacción. Tus datos siguen en el formulario, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete transaction?")) return;
    try {
      await apiFetch(`/api/transactions/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar la transacción.\n\n${(err as Error).message}`);
    }
  };

  const chartData = monthly.map((m) => ({
    month: m.yearMonth.slice(5),
    income: m.income,
    expenses: m.expenses,
    net: m.net,
  }));

  const months = Array.from(new Set(transactions.map((t) => t.date.slice(0, 7)))).sort().reverse();

  const handleExport = () => {
    const exportYear = monthFilter
      ? parseInt(monthFilter.slice(0, 4))
      : new Date().getFullYear();
    const clientNameMap = Object.fromEntries(clients.map((c) => [c.id, c.businessName]));
    const blob = generateTaxReport(exportYear, transactions, clientNameMap);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Teso_Graphics_Tax_Report_${exportYear}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <TopBar
        title="Finance"
        subtitle="Income & Expenses Tracker"
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleExport} style={btnExport}>
              <Download size={14} /> Export for Taxes
            </button>
            <button onClick={openNew} style={btnPrimary}><Plus size={14} /> Add Transaction</button>
          </div>
        }
      />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 24 }}>
        {/* YTD Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          <Card padding={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <TrendingUp size={14} color="var(--status-green)" />
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>YTD Income</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--status-green)", fontFamily: "monospace" }}>{formatCurrency(ytd.income)}</div>
          </Card>
          <Card padding={16}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <TrendingDown size={14} color="var(--status-red)" />
              <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>YTD Expenses</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: "var(--status-red)", fontFamily: "monospace" }}>{formatCurrency(ytd.expenses)}</div>
          </Card>
          <Card padding={16}>
            <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Net Profit</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: ytd.net >= 0 ? "var(--status-green)" : "var(--status-red)", fontFamily: "monospace" }}>{formatCurrency(ytd.net)}</div>
          </Card>
        </div>

        {/* Chart — collapsible */}
        {chartData.length > 0 && (
          <Card padding={0}>
            <div
              onClick={() => setChartOpen((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 16px", cursor: "pointer", userSelect: "none", borderBottom: chartOpen ? "1px solid var(--border)" : "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}
            >
              {chartOpen ? <ChevronDown size={15} style={{ color: "var(--beige)" }} /> : <ChevronRight size={15} style={{ color: "var(--text-muted)" }} />}
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Monthly Overview</h3>
            </div>
            {chartOpen && (
              <div style={{ padding: 16 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      labelStyle={{ color: "var(--text-muted)", fontSize: 11 }}
                      itemStyle={{ fontSize: 12 }}
                      formatter={(v: number) => formatCurrency(v)}
                    />
                    <Bar dataKey="income" fill="#3a9b6f" radius={[3, 3, 0, 0]} name="Income" />
                    <Bar dataKey="expenses" fill="#c97047" radius={[3, 3, 0, 0]} name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        )}

        {/* Transactions Table */}
        <Card padding={0}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Transactions</h3>
            <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transactions..."
                style={{ padding: "6px 10px 6px 28px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 12, color: "var(--text-primary)", width: "100%" }}
              />
            </div>
            {["all", "income", "expense"].map((f) => (
              <button key={f} onClick={() => setTypeFilter(f as typeof typeFilter)} style={{
                padding: "4px 12px", borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: "pointer",
                border: `1px solid ${typeFilter === f ? "transparent" : "var(--border)"}`,
                backgroundColor: typeFilter === f ? (f === "income" ? "var(--status-green)" : f === "expense" ? "#c97047" : "var(--beige)") : "var(--bg-card)",
                color: typeFilter === f ? "#ffffff" : "var(--text-muted)",
                textTransform: "capitalize",
              }}>{f}</button>
            ))}
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} style={{ padding: "4px 8px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 11, color: "var(--text-muted)", cursor: "pointer" }}>
              <option value="">All months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No transactions.</div>
          ) : (
            Object.entries(
              [...filtered]
                .sort((a, b) => b.date.localeCompare(a.date))
                .reduce<Record<string, Transaction[]>>((acc, t) => {
                  const ym = t.date.slice(0, 7);
                  if (!acc[ym]) acc[ym] = [];
                  acc[ym].push(t);
                  return acc;
                }, {})
            )
              .sort((a, b) => b[0].localeCompare(a[0]))
              .map(([ym, txns]) => {
                const isOpen = search ? true : (expandedMonths[ym] ?? false);
                const monthIncome = txns.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
                const monthExpense = txns.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
                const monthLabel = formatLocalDate(`${ym}-01`, { month: "long", year: "numeric" });
                return (
                  <div key={ym} style={{ borderBottom: "1px solid var(--border)" }}>
                    <div
                      onClick={() => setExpandedMonths((prev) => ({ ...prev, [ym]: !prev[ym] }))}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", cursor: "pointer", userSelect: "none", backgroundColor: isOpen ? "rgba(200,178,153,0.08)" : "transparent" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(200,178,153,0.12)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isOpen ? "rgba(200,178,153,0.08)" : "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {isOpen ? <ChevronDown size={14} style={{ color: "var(--beige)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{monthLabel}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{txns.length} transaction{txns.length !== 1 ? "s" : ""}</span>
                      </div>
                      <div style={{ display: "flex", gap: 14, fontSize: 12, fontFamily: "monospace" }}>
                        <span style={{ color: "var(--status-green)" }}>+{formatCurrency(monthIncome)}</span>
                        <span style={{ color: "var(--status-red)" }}>−{formatCurrency(monthExpense)}</span>
                      </div>
                    </div>
                    {isOpen && (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.02)" }}>
                            {["Date", "Type", "Category", "Description", "Client", "Amount", ""].map((h) => (
                              <th key={h} style={{ textAlign: "left", padding: "6px 14px", fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {txns.map((t) => (
                            <tr key={t.id} onClick={() => openEdit(t)} style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                              <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontFamily: "monospace", fontSize: 12 }}>{t.date}</td>
                              <td style={{ padding: "9px 14px" }}>
                                <span style={{ fontSize: 11, padding: "2px 7px", borderRadius: 3, backgroundColor: t.type === "income" ? "var(--green-bg)" : "var(--red-bg)", color: t.type === "income" ? "var(--green-text)" : "var(--red-text)", textTransform: "capitalize", fontWeight: 600 }}>
                                  {t.type}
                                </span>
                              </td>
                              <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: 11 }}>{t.category}</td>
                              <td style={{ padding: "9px 14px", color: "var(--text-primary)", fontSize: 12 }}>{t.description ?? "—"}</td>
                              <td style={{ padding: "9px 14px", color: "var(--text-muted)", fontSize: 11 }}>{t.clientId ? clientMap[t.clientId]?.businessName : "—"}</td>
                              <td style={{ padding: "9px 14px", fontFamily: "monospace", fontWeight: 600, color: t.type === "income" ? "var(--status-green)" : "var(--status-red)" }}>
                                {t.type === "income" ? "+" : "−"}{formatCurrency(t.amount)}
                              </td>
                              <td style={{ padding: "9px 14px" }}>
                                <button onClick={(e) => { e.stopPropagation(); del(t.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11 }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })
          )}
        </Card>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTarget ? "Edit Transaction" : "Add Transaction"} width={560} confirmClose>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Type *">
              <select value={form.type ?? "income"} onChange={(e) => setForm({ ...form, type: e.target.value as Transaction["type"], category: "", paymentMethod: undefined, vendor: undefined })} style={selectStyle}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </Field>
            <Field label="Date *"><input type="date" value={form.date ?? ""} onChange={(e) => setForm({ ...form, date: e.target.value })} style={inputStyle} /></Field>
            <Field label="Category *">
              {addingCategory ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomCategory(); } }}
                    placeholder="New category name..."
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button onClick={addCustomCategory} style={{ ...btnPrimary, padding: "8px 12px" }}>Add</button>
                  <button onClick={() => { setAddingCategory(false); setNewCategoryName(""); }} style={{ ...btnSecondary, padding: "8px 12px" }}>✕</button>
                </div>
              ) : (
                <select
                  value={form.category ?? ""}
                  onChange={(e) => {
                    if (e.target.value === "__add_new__") { setAddingCategory(true); return; }
                    setForm({ ...form, category: e.target.value });
                  }}
                  style={selectStyle}
                >
                  <option value="">Select...</option>
                  {(form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  {customCategories.length > 0 && (
                    <optgroup label="Custom">
                      {customCategories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </optgroup>
                  )}
                  <option value="__add_new__">+ Add new category...</option>
                </select>
              )}
            </Field>
            <Field label="Amount ($) *"><input type="number" value={form.amount ?? ""} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })} placeholder="0.00" style={inputStyle} /></Field>
            <Field label="Client">
              <select value={form.clientId ?? ""} onChange={(e) => setForm({ ...form, clientId: e.target.value || undefined })} style={selectStyle}>
                <option value="">None</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </Field>
            {form.type === "expense" && (
              <>
                <Field label="Payment Method">
                  <select value={form.paymentMethod ?? ""} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value || undefined })} style={selectStyle}>
                    <option value="">Select...</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Paid To / Place of Purchase">
                  <input value={form.vendor ?? ""} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Adobe, Office Depot..." style={inputStyle} />
                </Field>
              </>
            )}
          </div>
          <Field label="Description">
            <input value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, width: "100%" }} />
          </Field>
          <Field label="Notes">
            <textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={!form.type || !form.category || !form.amount || !form.date || loading} style={btnPrimary}>
              {loading ? "Saving..." : editTarget ? "Update" : "Add"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { padding: "8px 10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 13, color: "var(--text-primary)", width: "100%" };
const selectStyle: React.CSSProperties = { padding: "8px 10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 13, color: "var(--text-primary)", width: "100%" };
const btnPrimary: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "8px 18px", backgroundColor: "var(--beige)", color: "var(--carbon)", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnSecondary: React.CSSProperties = { padding: "8px 16px", backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer", fontSize: 13 };
const btnExport: React.CSSProperties = { display: "flex", alignItems: "center", gap: 5, padding: "8px 16px", backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 500 };
