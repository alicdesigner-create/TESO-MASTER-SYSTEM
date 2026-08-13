"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import StatusBadge from "@/components/ui/StatusBadge";
import { Quote, Client } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { Plus, Eye, Copy, Trash2, RefreshCw, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { convertQuoteToInvoice, CONVERTIBLE_QUOTE_STATUSES } from "@/lib/quoteToInvoice";
import { todayISO } from "@/lib/date";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [converting, setConverting] = useState<string | null>(null);

  const load = async () => {
    const [q, c] = await Promise.all([
      fetch("/api/quotes").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setQuotes(q); setClients(c);
  };
  useEffect(() => { load(); }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const sorted = [...quotes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totalSent = quotes.filter((q) => ["sent", "accepted"].includes(q.status as string)).reduce((s, q) => s + q.total, 0);

  const del = async (id: string) => {
    if (!confirm("Delete this quote?")) return;
    try {
      await apiFetch(`/api/quotes/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar la cotización.\n\n${(err as Error).message}`);
    }
  };

  const duplicate = async (q: Quote) => {
    try {
      const today = todayISO();
      const subtotal = q.items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      const taxRate = q.taxRate ?? 0;
      const taxAmount = subtotal * (taxRate / 100);
      const newQuote = {
        clientId: q.clientId,
        date: today,
        validDays: 30,
        status: "draft",
        taxRate,
        taxAmount,
        subtotal,
        total: subtotal + taxAmount,
        notes: q.notes,
        items: q.items.map((it) => ({
          ...it,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        })),
      };
      const res = await apiFetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newQuote),
      });
      const created = await res.json();
      showToast(`Quote duplicada como ${created.quoteNumber}`);
      router.push(`/quotes/${created.id}`);
    } catch (err) {
      alert(`No se pudo duplicar la cotización.\n\n${(err as Error).message}`);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const generateInvoice = async (q: Quote) => {
    if (q.status === "draft" && !confirm("Esta quote aún no ha sido aceptada. ¿Generar factura de todas formas?")) return;
    setConverting(q.id);
    try {
      const created = await convertQuoteToInvoice(q);
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      alert(`No se pudo generar la factura.\n\n${(err as Error).message}`);
    } finally {
      setConverting(null);
    }
  };

  return (
    <>
      <TopBar
        title="Quotes"
        subtitle={`${quotes.length} quotes · ${formatCurrency(totalSent)} pending acceptance`}
        actions={
          <Link href="/quotes/new" style={btnPrimary}>
            <Plus size={14} /> New Quote
          </Link>
        }
      />
      <div style={{ padding: 28 }}>
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.03)" }}>
                {["Number", "Client", "Date", "Valid Until", "Total", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No quotes yet.</td></tr>
              ) : (
                sorted.map((q) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "var(--beige)", fontWeight: 600 }}>{q.quoteNumber}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-primary)" }}>{clientMap[q.clientId]?.businessName ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>{q.date}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>{q.validDays ? `${q.validDays} days` : "—"}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(q.total)}</td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={q.status} size="sm" /></td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Link href={`/quotes/${q.id}`} style={{ color: "var(--beige)", display: "flex" }} title="View quote"><Eye size={13} /></Link>
                        <button onClick={() => duplicate(q)} style={iconBtn} title="Duplicate quote"><Copy size={13} /></button>
                        {q.convertedToInvoiceId ? (
                          <Link href={`/invoices/${q.convertedToInvoiceId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: "var(--status-blue)", textDecoration: "none" }}>
                            Ver Invoice →
                          </Link>
                        ) : CONVERTIBLE_QUOTE_STATUSES.includes(q.status) ? (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            {q.status === "draft" && (
                              <AlertTriangle size={12} color="var(--yellow-text)" aria-label="Esta quote aún no ha sido aceptada" />
                            )}
                            <button
                              onClick={() => generateInvoice(q)}
                              disabled={converting === q.id}
                              title={q.status === "draft" ? "Esta quote aún no ha sido aceptada" : "Generate Invoice"}
                              style={{ background: "none", borderWidth: 1, borderStyle: "solid", borderColor: "var(--green-bg)", cursor: "pointer", color: "var(--status-green)", fontSize: 11, padding: "2px 7px", borderRadius: 3, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <RefreshCw size={11} /> {converting === q.id ? "..." : "Generate Invoice"}
                            </button>
                          </div>
                        ) : null}
                        <button onClick={() => del(q.id)} style={iconBtn} title="Delete quote" onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", borderRadius: 8,
          padding: "12px 18px", fontSize: 13, color: "var(--text-primary)",
          zIndex: 100, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "var(--status-green)", fontWeight: 700 }}>✓</span>
          {toast}
        </div>
      )}
    </>
  );
}

const btnPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 18px", backgroundColor: "var(--beige)", color: "var(--carbon)", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 600, textDecoration: "none" };
const iconBtn: React.CSSProperties = { background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0, display: "flex", alignItems: "center" };
