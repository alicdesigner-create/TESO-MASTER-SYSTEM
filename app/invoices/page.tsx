"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import StatusBadge from "@/components/ui/StatusBadge";
import { Invoice, Client } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { Plus, Eye, Copy, Trash2, Pencil } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { todayISO, addDaysISO } from "@/lib/date";

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    const [i, c] = await Promise.all([
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setInvoices(i); setClients(c);
  };
  useEffect(() => { load(); }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const sorted = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const balanceDue = (inv: Invoice) => inv.total - (inv.depositAmount ?? 0);
  const unpaid = invoices.filter((i) => ["unpaid", "overdue", "partial"].includes(i.status)).reduce((s, i) => s + balanceDue(i), 0);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);

  const del = async (id: string) => {
    if (!confirm("Delete this invoice?")) return;
    try {
      await apiFetch(`/api/invoices/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar el invoice.\n\n${(err as Error).message}`);
    }
  };

  const markPaid = async (inv: Invoice) => {
    try {
      await apiFetch(`/api/invoices/${inv.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...inv, status: "paid", paidAt: todayISO(), paidAmount: inv.total }),
      });
      load();
    } catch (err) {
      alert(`No se pudo marcar el invoice como pagado.\n\n${(err as Error).message}`);
    }
  };

  const duplicate = async (inv: Invoice) => {
    try {
      const today = todayISO();
      const subtotal = inv.items.reduce((s, it) => s + it.amount, 0);
      const newInvoice = {
        clientId: inv.clientId,
        date: today,
        dueDate: addDaysISO(today, 30),
        status: "unpaid",
        subtotal,
        total: subtotal,
        notes: inv.notes,
        items: inv.items.map((it) => ({
          ...it,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        })),
      };
      const res = await apiFetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newInvoice),
      });
      const created = await res.json();
      showToast(`Invoice duplicado como #${created.invoiceNumber}`);
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      alert(`No se pudo duplicar el invoice.\n\n${(err as Error).message}`);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <>
      <TopBar
        title="Invoices"
        subtitle={`${invoices.length} invoices · ${formatCurrency(unpaid)} receivable · ${formatCurrency(totalPaid)} collected`}
        actions={
          <Link href="/invoices/new" style={btnPrimary}>
            <Plus size={14} /> New Invoice
          </Link>
        }
      />
      <div style={{ padding: 28 }}>
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.03)" }}>
                {["Number", "Client", "Date", "Due Date", "Total", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No invoices yet.</td></tr>
              ) : (
                sorted.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "var(--beige)", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-primary)" }}>{clientMap[inv.clientId]?.businessName ?? "—"}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>{inv.date}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 12 }}>{inv.dueDate ?? "—"}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(balanceDue(inv))}</td>
                    <td style={{ padding: "10px 14px" }}><StatusBadge status={inv.status} size="sm" /></td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Link href={`/invoices/${inv.id}`} style={{ color: "var(--beige)", display: "flex" }} title="View invoice"><Eye size={13} /></Link>
                        <button onClick={() => duplicate(inv)} style={iconBtn} title="Duplicate invoice"><Copy size={13} /></button>
                        {["unpaid", "overdue", "partial"].includes(inv.status) && (
                          <button onClick={() => markPaid(inv)} style={{ background: "none", borderWidth: 1, borderStyle: "solid", borderColor: "var(--green-bg)", cursor: "pointer", color: "var(--status-green)", fontSize: 11, padding: "2px 7px", borderRadius: 3, fontWeight: 500 }}>
                            Mark Paid
                          </button>
                        )}
                        <Link href={`/invoices/${inv.id}`} style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, textDecoration: "none" }} title="Edit invoice"><Pencil size={13} /> Edit</Link>
                        <button onClick={() => del(inv.id)} style={iconBtn} title="Delete invoice" onMouseEnter={(e) => (e.currentTarget.style.color = "var(--red-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}><Trash2 size={13} /></button>
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
