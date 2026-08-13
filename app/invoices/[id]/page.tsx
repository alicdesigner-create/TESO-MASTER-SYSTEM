"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import { Invoice, Client, InvoiceItem } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { ArrowLeft, Plus, Trash2, Save, CheckCircle } from "lucide-react";
import { useNavigationGuard } from "@/contexts/NavigationGuard";
import { apiFetch } from "@/lib/api";
import { todayISO } from "@/lib/date";

const InvoiceDownloadButton = dynamic(() => import("@/components/pdf/InvoiceDownloadButton"), { ssr: false });

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { registerBlock, unregisterBlock, requestNavigation } = useNavigationGuard();
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<Partial<Invoice>>({
    status: "unpaid",
    date: todayISO(),
    dueDate: "",
    items: [],
    subtotal: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const isNew = id === "new";

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
    if (!isNew) {
      fetch(`/api/invoices/${id}`).then((r) => r.json()).then(setForm);
    }
  }, [id]);

  // Sync unsaved state with navigation guard
  useEffect(() => {
    if (hasUnsaved) {
      registerBlock("invoice");
    } else {
      unregisterBlock();
    }
  }, [hasUnsaved, registerBlock, unregisterBlock]);

  // Browser close/reload protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsaved) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const recalc = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((s, it) => s + it.amount, 0);
    setHasUnsaved(true);
    setForm((f) => ({ ...f, items, subtotal, total: subtotal }));
  };

  const updateItem = (i: number, field: keyof InvoiceItem, value: string | number) => {
    const items = [...(form.items ?? [])];
    const item = { ...items[i], [field]: value };
    if (field === "amount") item.amount = value as number;
    items[i] = item;
    recalc(items);
  };

  const addItem = () => {
    recalc([...(form.items ?? []), { id: Date.now().toString(36), description: "", qty: 1, unitPrice: 0, amount: 0 }]);
  };

  const removeItem = (i: number) => {
    recalc((form.items ?? []).filter((_, idx) => idx !== i));
  };

  const updateDeposit = (value: string) => {
    const depositAmount = parseFloat(value) || 0;
    const subtotal = form.subtotal ?? 0;
    setHasUnsaved(true);
    setForm((f) => ({
      ...f,
      depositAmount,
      status: depositAmount > 0 && depositAmount < subtotal ? "partial" : f.status,
    }));
  };

  const markPaid = async () => {
    const now = todayISO();
    const updatedForm = { ...form, status: "paid" as const, paidAt: now, paidAmount: form.total };
    if (form.clientId && form.total) {
      try {
        await apiFetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "income",
            category: "Web Design – Recurring / Maintenance",
            amount: form.total,
            date: now.slice(0, 10),
            description: `Invoice #${form.invoiceNumber} - ${client?.businessName ?? ""}`,
            clientId: form.clientId,
            invoiceId: isNew ? undefined : id,
          }),
        });
      } catch (err) {
        alert(`No se pudo registrar la transacción de pago. La factura NO se marcó como pagada, intenta de nuevo.\n\n${(err as Error).message}`);
        return;
      }
    }
    setHasUnsaved(true);
    setForm(updatedForm);
  };

  const save = async () => {
    setLoading(true);
    try {
      if (isNew) {
        const res = await apiFetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        unregisterBlock();
        setHasUnsaved(false);
        router.replace(`/invoices/${created.id}`);
      } else {
        await apiFetch(`/api/invoices/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        unregisterBlock();
        setHasUnsaved(false);
      }
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (err) {
      alert(`No se pudo guardar la factura. Tus cambios siguen aquí, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const client = form.clientId ? clientMap[form.clientId] : null;

  return (
    <>
      <TopBar
        title={isNew ? "New Invoice" : `Invoice #${form.invoiceNumber ?? ""}`}
        subtitle={client?.businessName}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => requestNavigation("/invoices")} style={btnSecondary}>
              <ArrowLeft size={13} /> Back
            </button>
            {(form.status === "unpaid" || form.status === "overdue") && (
              <button onClick={markPaid} style={{ ...btnSecondary, color: "var(--status-green)", borderColor: "var(--green-bg)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <CheckCircle size={13} /> Mark Paid
              </button>
            )}
            {!isNew && form.clientId && client && (
              <InvoiceDownloadButton invoice={form as Invoice} client={client} />
            )}
            <button onClick={save} disabled={loading} style={btnPrimary}><Save size={13} /> {loading ? "Saving..." : "Save"}</button>
          </div>
        }
      />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header fields */}
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <Field label="Client *">
              <select value={form.clientId ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, clientId: e.target.value }); }} style={selectStyle}>
                <option value="">Select...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </Field>
            <Field label="Invoice Date">
              <input type="date" value={form.date ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, date: e.target.value }); }} style={inputStyle} />
            </Field>
            <Field label="Due Date">
              <input type="date" value={form.dueDate ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, dueDate: e.target.value }); }} style={inputStyle} />
            </Field>
            <Field label="Status">
              <select value={form.status ?? "unpaid"} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, status: e.target.value as Invoice["status"] }); }} style={selectStyle}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="partial">Partial</option>
              </select>
            </Field>
            {form.status === "paid" && (
              <Field label="Paid At">
                <input type="date" value={form.paidAt?.slice(0, 10) ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, paidAt: e.target.value }); }} style={inputStyle} />
              </Field>
            )}
          </div>
        </Card>

        {/* Line Items */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Line Items</h3>
            <button onClick={addItem} style={{ ...btnSecondary, display: "inline-flex", alignItems: "center", gap: 5 }}><Plus size={12} /> Add Item</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Description", "Qty", "Amount", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "6px 8px 10px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(form.items ?? []).length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "20px 8px", color: "var(--text-muted)", fontSize: 12 }}>No items yet.</td></tr>
              ) : (
                (form.items ?? []).map((item, i) => (
                  <tr key={item.id ?? i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", width: "45%" }}>
                      <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="Service..." />
                    </td>
                    <td style={{ padding: "6px 8px", width: 80 }}>
                      <input type="number" min={1} value={item.qty ?? ""} onChange={(e) => updateItem(i, "qty", parseFloat(e.target.value) || 1)} style={{ ...inputStyle, width: "100%" }} placeholder="1" />
                    </td>
                    <td style={{ padding: "6px 8px", width: 120 }}>
                      <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--text-muted)", pointerEvents: "none" }}>$</span>
                        <input type="number" value={item.amount} onChange={(e) => updateItem(i, "amount", parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: "100%", fontFamily: "monospace", paddingLeft: 20 }} />
                      </div>
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-red)", padding: 2 }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Deposit */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 240 }}>
              <Field label="Deposit received / Pago recibido">
                <input
                  type="number"
                  value={form.depositAmount ?? ""}
                  onChange={(e) => updateDeposit(e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle, width: "100%", fontFamily: "monospace" }}
                />
              </Field>
            </div>
          </div>

          {/* Totals */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 240 }}>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "var(--text-muted)" }}>
                <span>Subtotal</span>
                <span style={{ fontFamily: "monospace" }}>{formatCurrency(form.subtotal ?? 0)}</span>
              </div>
              {(form.depositAmount ?? 0) > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "var(--status-green)" }}>
                  <span>Deposit received</span>
                  <span style={{ fontFamily: "monospace" }}>−{formatCurrency(form.depositAmount ?? 0)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--border)", marginTop: 6 }}>
                <span>{(form.depositAmount ?? 0) > 0 ? "BALANCE DUE" : "Total"}</span>
                <span style={{ fontFamily: "monospace", color: "var(--beige)" }}>
                  {formatCurrency((form.subtotal ?? 0) - (form.depositAmount ?? 0))}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card>
          <Field label="Notes / Payment Instructions">
            <textarea value={form.notes ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, notes: e.target.value }); }} rows={4} placeholder="Payment method, bank details, etc..." style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
          </Field>
        </Card>
      </div>

      {savedToast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          backgroundColor: "var(--bg-card)", border: "1px solid var(--border)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)", borderRadius: 8,
          padding: "12px 18px", fontSize: 13, color: "var(--text-primary)",
          zIndex: 100, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: "var(--status-green)", fontWeight: 700 }}>✓</span>
          Cambios guardados
        </div>
      )}
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

const inputStyle: React.CSSProperties = { padding: "7px 9px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 13, color: "var(--text-primary)" };
const selectStyle: React.CSSProperties = { padding: "7px 9px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", borderRadius: 5, fontSize: 13, color: "var(--text-primary)", width: "100%" };
const btnPrimary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 16px", backgroundColor: "var(--beige)", color: "var(--carbon)", border: "none", borderRadius: 5, cursor: "pointer", fontSize: 13, fontWeight: 600 };
const btnSecondary: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 14px", backgroundColor: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: 5, cursor: "pointer", fontSize: 13, textDecoration: "none" };
