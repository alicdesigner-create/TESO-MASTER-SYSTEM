"use client";

import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { Project, Client, Quote, QuoteItem, QuoteItemStatus, DESIGN_TYPES } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { formatLocalDate } from "@/lib/date";
import { itemStatusColor } from "@/lib/itemStatus";
import { Plus, Search, ChevronDown, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

const ITEM_STATUSES: { value: QuoteItemStatus; label: string }[] = [
  { value: "pending",     label: "Pending" },
  { value: "approved",    label: "Approved" },
  { value: "in_progress", label: "In Progress" },
  { value: "done",        label: "Done" },
  { value: "rejected",    label: "Rejected" },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [form, setForm] = useState<Partial<Project>>({ status: "pending", quotedPrice: 0 });
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [savingItem, setSavingItem] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [p, c, q] = await Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/quotes").then((r) => r.json()),
    ]);
    setProjects(p);
    setClients(c);
    setQuotes(q);
    setExpanded((prev) => (Object.keys(prev).length > 0 ? prev : {}));
  }, []);

  useEffect(() => { load(); }, [load]);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  // All clientIds that appear in projects OR quotes, filtered by search
  const allClientIds = Array.from(new Set([
    ...projects.map((p) => p.clientId),
    ...quotes.map((q) => q.clientId),
  ])).filter((cid) => {
    if (!search) return true;
    const name = clientMap[cid]?.businessName ?? "";
    const projectTypes = projects.filter((p) => p.clientId === cid).map((p) => p.typeOfDesign).join(" ");
    const quoteDescs = quotes.filter((q) => q.clientId === cid).flatMap((q) => q.items.map((i) => i.description)).join(" ");
    return `${name} ${projectTypes} ${quoteDescs}`.toLowerCase().includes(search.toLowerCase());
  });

  const toggleClient = (clientId: string) =>
    setExpanded((prev) => ({ ...prev, [clientId]: !prev[clientId] }));

  // Update a single quote item status and save
  const updateItemStatus = async (quote: Quote, itemId: string, status: QuoteItemStatus) => {
    setSavingItem(itemId);
    const updatedItems = quote.items.map((it) =>
      it.id === itemId ? { ...it, status } : it
    );
    const updatedQuote = { ...quote, items: updatedItems };
    const previousQuotes = quotes;
    setQuotes((prev) => prev.map((q) => q.id === quote.id ? updatedQuote : q));
    try {
      await apiFetch(`/api/quotes/${quote.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedQuote),
      });
    } catch (err) {
      setQuotes(previousQuotes);
      alert(`No se pudo guardar el cambio de estado. Se revirtió el cambio, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setSavingItem(null);
    }
  };

  const openNew = () => { setEditTarget(null); setForm({ status: "pending", quotedPrice: 0 }); setShowForm(true); };
  const openEdit = (p: Project) => { setEditTarget(p); setForm(p); setShowForm(true); };

  const save = async () => {
    setLoading(true);
    try {
      if (editTarget) {
        await apiFetch(`/api/projects/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        await apiFetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      await load();
      setShowForm(false);
    } catch (err) {
      alert(`No se pudo guardar el proyecto. Tus datos siguen en el formulario, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar el proyecto.\n\n${(err as Error).message}`);
    }
  };

  const totalAll = projects.reduce((s, p) => s + p.quotedPrice + (p.extraCharge ?? 0), 0)
    + quotes.reduce((s, q) => s + q.total, 0);

  return (
    <>
      <TopBar
        title="Projects"
        subtitle={`${allClientIds.length} clients · ${formatCurrency(totalAll)} in quotes & projects`}
        actions={
          <button onClick={openNew} style={btnPrimary}>
            <Plus size={14} /> New Project
          </button>
        }
      />
      <div style={{ padding: 28 }}>
        {/* Search */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ position: "relative", maxWidth: 320 }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client or service..." style={{ ...inputStyle, paddingLeft: 30 }} />
          </div>
        </div>

        {/* Grouped by client */}
        {allClientIds.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8 }}>
            No projects or quotes found.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {allClientIds.map((clientId) => {
              const client = clientMap[clientId];
              const clientProjects = projects.filter((p) => p.clientId === clientId);
              const clientQuotes = quotes.filter((q) => q.clientId === clientId);
              const isOpen = expanded[clientId] ?? false;

              // Summary counts from quote items
              const allItems = clientQuotes.flatMap((q) => q.items);
              const itemStatusCounts = allItems.reduce<Record<string, number>>((acc, it) => {
                const s = it.status ?? "pending";
                acc[s] = (acc[s] ?? 0) + 1;
                return acc;
              }, {});

              const clientTotal = clientQuotes.reduce((s, q) => s + q.total, 0)
                + clientProjects.reduce((s, p) => s + p.quotedPrice + (p.extraCharge ?? 0), 0);

              return (
                <div key={clientId} style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  {/* Client header */}
                  <div
                    onClick={() => toggleClient(clientId)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 16px", cursor: "pointer", userSelect: "none",
                      backgroundColor: isOpen ? "rgba(200,178,153,0.08)" : "transparent",
                      borderBottom: isOpen ? "1px solid var(--border)" : "none",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(200,178,153,0.12)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isOpen ? "rgba(200,178,153,0.08)" : "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      {isOpen
                        ? <ChevronDown size={15} style={{ color: "var(--beige)", flexShrink: 0 }} />
                        : <ChevronRight size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                      }
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                        {client?.businessName ?? "Unknown"}
                      </span>
                      {clientQuotes.length > 0 && (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {clientQuotes.length} quote{clientQuotes.length !== 1 ? "s" : ""} · {allItems.length} service{allItems.length !== 1 ? "s" : ""}
                        </span>
                      )}
                      {/* Item status pills */}
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {Object.entries(itemStatusCounts).map(([status, count]) => (
                          <span key={status} style={{
                            fontSize: 10, fontWeight: 500, padding: "2px 7px", borderRadius: 10,
                            backgroundColor: itemStatusColor(status as QuoteItemStatus).bg,
                            color: itemStatusColor(status as QuoteItemStatus).text,
                          }}>
                            {ITEM_STATUSES.find((s) => s.value === status)?.label ?? status}
                            {count > 1 ? ` ×${count}` : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontFamily: "monospace", color: "var(--beige)", fontWeight: 600, flexShrink: 0 }}>
                      {formatCurrency(clientTotal)}
                    </span>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div>
                      {/* Quote items — one block per quote */}
                      {clientQuotes.map((quote) => (
                        <div key={quote.id}>
                          {/* Quote subheader */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 16px", backgroundColor: "rgba(0,0,0,0.025)", borderBottom: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <FileText size={11} style={{ color: "var(--beige)" }} />
                              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                                Quote {quote.quoteNumber}
                              </span>
                              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                                · {formatLocalDate(quote.date)}
                              </span>
                              <span style={{
                                fontSize: 10, fontWeight: 500, padding: "1px 6px", borderRadius: 8,
                                backgroundColor: qStatusColor(quote.status).bg,
                                color: qStatusColor(quote.status).text,
                                textTransform: "capitalize",
                              }}>
                                {quote.status}
                              </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>{formatCurrency(quote.total)}</span>
                              <Link href={`/quotes/${quote.id}`} style={{ fontSize: 11, color: "var(--beige)", textDecoration: "none" }}>Edit quote →</Link>
                            </div>
                          </div>

                          {/* Quote line items with status selector */}
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ backgroundColor: "rgba(0,0,0,0.01)" }}>
                                {["Service / Description", "Qty", "Amount", "Status"].map((h) => (
                                  <th key={h} style={{ textAlign: "left", padding: "5px 16px", fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {quote.items.map((item: QuoteItem) => (
                                <tr key={item.id} style={{ borderTop: "1px solid var(--border)" }}>
                                  <td style={{ padding: "9px 16px", color: "var(--text-primary)", width: "52%" }}>{item.description}</td>
                                  <td style={{ padding: "9px 16px", color: "var(--text-muted)", width: 60 }}>{item.qty}</td>
                                  <td style={{ padding: "9px 16px", fontFamily: "monospace", color: "var(--text-muted)", width: 110 }}>
                                    {formatCurrency(item.qty * item.unitPrice)}
                                  </td>
                                  <td style={{ padding: "6px 16px" }}>
                                    <select
                                      value={item.status ?? "pending"}
                                      disabled={savingItem === item.id}
                                      onChange={(e) => updateItemStatus(quote, item.id, e.target.value as QuoteItemStatus)}
                                      onClick={(e) => e.stopPropagation()}
                                      className={`status-select-${item.status ?? "pending"}`}
                                      style={{
                                        padding: "5px 10px",
                                        fontSize: 12,
                                        borderRadius: 5,
                                        border: "none",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                        opacity: savingItem === item.id ? 0.6 : 1,
                                        appearance: "none",
                                        WebkitAppearance: "none",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.15)",
                                      }}
                                    >
                                      {ITEM_STATUSES.map((s) => (
                                        <option key={s.value} value={s.value}>{s.label}</option>
                                      ))}
                                    </select>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}

                      {/* Manual projects (legacy) */}
                      {clientProjects.length > 0 && (
                        <div style={{ borderTop: "2px solid var(--border)" }}>
                          <div style={{ padding: "6px 16px", backgroundColor: "rgba(0,0,0,0.02)" }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                              Additional Projects
                            </span>
                          </div>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ backgroundColor: "rgba(0,0,0,0.01)" }}>
                                {["Type of Work", "Quoted", "Extra", "Status", "Note", ""].map((h) => (
                                  <th key={h} style={{ textAlign: "left", padding: "5px 16px", fontSize: 10, color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {clientProjects.map((p) => (
                                <tr key={p.id} onClick={() => openEdit(p)} style={{ borderTop: "1px solid var(--border)", cursor: "pointer" }}
                                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                                  <td style={{ padding: "9px 16px", color: "var(--text-primary)" }}>{p.typeOfDesign}</td>
                                  <td style={{ padding: "9px 16px", fontFamily: "monospace", color: "var(--text-muted)" }}>{formatCurrency(p.quotedPrice)}</td>
                                  <td style={{ padding: "9px 16px", fontFamily: "monospace", color: "var(--text-muted)" }}>{p.extraCharge ? formatCurrency(p.extraCharge) : "—"}</td>
                                  <td style={{ padding: "9px 16px" }}><StatusBadge status={p.status} size="sm" /></td>
                                  <td style={{ padding: "9px 16px", color: "var(--text-muted)", fontSize: 11, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.statusNote ?? "—"}</td>
                                  <td style={{ padding: "9px 16px" }}>
                                    <button onClick={(e) => { e.stopPropagation(); del(p.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11, padding: "2px 6px" }}>✕</button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTarget ? "Edit Project" : "New Project"} width={600}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Client *">
              <select value={form.clientId ?? ""} onChange={(e) => setForm({ ...form, clientId: e.target.value })} style={selectStyle}>
                <option value="">Select client...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </Field>
            <Field label="Type of Design *">
              <select value={form.typeOfDesign ?? ""} onChange={(e) => setForm({ ...form, typeOfDesign: e.target.value })} style={selectStyle}>
                <option value="">Select type...</option>
                {DESIGN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Quoted Price">
              <input type="number" value={form.quotedPrice ?? 0} onChange={(e) => setForm({ ...form, quotedPrice: parseFloat(e.target.value) || 0 })} placeholder="0.00" style={inputStyle} />
            </Field>
            <Field label="Status">
              <select value={form.status ?? "pending"} onChange={(e) => setForm({ ...form, status: e.target.value as Project["status"] })} style={selectStyle}>
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Extra Charge">
              <input type="number" value={form.extraCharge ?? ""} onChange={(e) => setForm({ ...form, extraCharge: parseFloat(e.target.value) || undefined })} placeholder="0.00" style={inputStyle} />
            </Field>
            <Field label="Extra Charge Note">
              <input value={form.extraChargeNote ?? ""} onChange={(e) => setForm({ ...form, extraChargeNote: e.target.value })} style={inputStyle} />
            </Field>
          </div>
          <Field label="Status Note">
            <input value={form.statusNote ?? ""} onChange={(e) => setForm({ ...form, statusNote: e.target.value })} placeholder="e.g. design done - printing pending" style={{ ...inputStyle, width: "100%" }} />
          </Field>
          <Field label="Payment Note">
            <input value={form.paymentNote ?? ""} onChange={(e) => setForm({ ...form, paymentNote: e.target.value })} style={{ ...inputStyle, width: "100%" }} />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={!form.clientId || !form.typeOfDesign || loading} style={btnPrimary}>
              {loading ? "Saving..." : editTarget ? "Update" : "Create Project"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function qStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "accepted":  return { bg: "rgba(58,144,96,0.15)",  text: "var(--status-green)" };
    case "sent":      return { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" };
    case "declined":  return { bg: "rgba(201,64,64,0.12)",  text: "var(--status-red)" };
    case "expired":   return { bg: "rgba(200,178,153,0.2)", text: "var(--beige)" };
    default:          return { bg: "rgba(0,0,0,0.06)",      text: "var(--text-muted)" };
  }
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
