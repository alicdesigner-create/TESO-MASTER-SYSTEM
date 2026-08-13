"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import { Quote, Client, QuoteItem } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { ArrowLeft, Plus, Trash2, Save, RefreshCw, AlertTriangle } from "lucide-react";
import { useNavigationGuard } from "@/contexts/NavigationGuard";
import { apiFetch } from "@/lib/api";
import { convertQuoteToInvoice, CONVERTIBLE_QUOTE_STATUSES } from "@/lib/quoteToInvoice";
import { todayISO } from "@/lib/date";
import { MAINTENANCE_PLANS, MAINTENANCE_NOTES, HOSTING_ONLY, MAINTENANCE_DISCLAIMER } from "@/lib/maintenancePlans";

const QuoteDownloadButton = dynamic(() => import("@/components/pdf/QuoteDownloadButton"), { ssr: false });

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { registerBlock, unregisterBlock, requestNavigation } = useNavigationGuard();
  const [clients, setClients] = useState<Client[]>([]);
  const [form, setForm] = useState<Partial<Quote>>({
    status: "draft",
    date: todayISO(),
    validDays: 30,
    taxRate: 0,
    taxAmount: 0,
    items: [],
    subtotal: 0,
    total: 0,
    includeMaintenancePlans: false,
  });
  const [loading, setLoading] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const isNew = id === "new";

  useEffect(() => {
    fetch("/api/clients").then((r) => r.json()).then(setClients);
    if (!isNew) {
      fetch(`/api/quotes/${id}`).then((r) => r.json()).then(setForm);
    }
  }, [id]);

  // Sync unsaved state with navigation guard
  useEffect(() => {
    if (hasUnsaved) {
      registerBlock("cotización");
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

  const recalc = (items: QuoteItem[], taxRate?: number) => {
    const subtotal = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
    const rate = taxRate ?? form.taxRate ?? 0;
    const taxAmount = subtotal * (rate / 100);
    setHasUnsaved(true);
    setForm((f) => ({ ...f, items, subtotal, taxAmount, total: subtotal + taxAmount }));
  };

  const updateItem = (i: number, field: "description" | "qty" | "amount", value: string | number) => {
    const items = [...(form.items ?? [])];
    const item = { ...items[i] };
    if (field === "description") {
      item.description = value as string;
    } else if (field === "qty") {
      item.qty = value as number;
      // keep the total amount the same, adjust unitPrice
      const currentAmount = item.qty > 0 ? item.unitPrice * items[i].qty : 0;
      item.unitPrice = (value as number) > 0 ? currentAmount / (value as number) : 0;
    } else if (field === "amount") {
      const amt = value as number;
      item.unitPrice = item.qty > 0 ? amt / item.qty : amt;
    }
    items[i] = item;
    recalc(items);
  };

  const addItem = () => {
    recalc([...(form.items ?? []), { id: Date.now().toString(36), qty: 1, description: "", unitPrice: 0 }]);
  };

  const removeItem = (i: number) => {
    recalc((form.items ?? []).filter((_, idx) => idx !== i));
  };

  const onTaxRateChange = (rate: number) => {
    const subtotal = (form.subtotal ?? 0);
    const taxAmount = subtotal * (rate / 100);
    setHasUnsaved(true);
    setForm((f) => ({ ...f, taxRate: rate, taxAmount, total: subtotal + taxAmount }));
  };

  const save = async () => {
    setLoading(true);
    try {
      if (isNew) {
        const res = await apiFetch("/api/quotes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const created = await res.json();
        unregisterBlock();
        setHasUnsaved(false);
        router.replace(`/quotes/${created.id}`);
      } else {
        await apiFetch(`/api/quotes/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        unregisterBlock();
        setHasUnsaved(false);
      }
    } catch (err) {
      alert(`No se pudo guardar la cotización. Tus cambios siguen aquí, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const convertToInvoice = async () => {
    if (!form.clientId || isNew) return;
    if (form.status === "draft" && !confirm("Esta quote aún no ha sido aceptada. ¿Generar factura de todas formas?")) return;
    setLoading(true);
    try {
      const created = await convertQuoteToInvoice(form as Quote);
      unregisterBlock();
      setHasUnsaved(false);
      router.push(`/invoices/${created.id}`);
    } catch (err) {
      alert(`No se pudo convertir la cotización a factura. Intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const client = form.clientId ? clientMap[form.clientId] : null;

  return (
    <>
      <TopBar
        title={isNew ? "New Quote" : `Quote ${form.quoteNumber ?? ""}`}
        subtitle={client?.businessName}
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={() => requestNavigation("/quotes")} style={btnSecondary}>
              <ArrowLeft size={13} /> Back
            </button>
            {!isNew && !form.convertedToInvoiceId && CONVERTIBLE_QUOTE_STATUSES.includes(form.status ?? "draft") && (
              <>
                {form.status === "draft" && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--yellow-text)" }} title="Esta quote aún no ha sido aceptada">
                    <AlertTriangle size={12} /> No aceptada aún
                  </span>
                )}
                <button onClick={convertToInvoice} disabled={loading} style={{ ...btnSecondary, color: "var(--status-green)", borderColor: "var(--green-bg)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <RefreshCw size={13} /> Generate Invoice
                </button>
              </>
            )}
            {form.convertedToInvoiceId && (
              <button onClick={() => requestNavigation(`/invoices/${form.convertedToInvoiceId}`)} style={{ ...btnSecondary, color: "var(--status-blue)", borderColor: "var(--blue-bg)", display: "inline-flex", alignItems: "center", gap: 5 }}>
                Ver Invoice →
              </button>
            )}
            {!isNew && form.clientId && client && (
              <QuoteDownloadButton quote={form as Quote} client={client} />
            )}
            <button onClick={save} disabled={loading} style={btnPrimary}><Save size={13} /> {loading ? "Saving..." : "Save"}</button>
          </div>
        }
      />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            <Field label="Client *">
              <select value={form.clientId ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, clientId: e.target.value }); }} style={selectStyle}>
                <option value="">Select...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </Field>
            <Field label="Quote Number">
              <input value={form.quoteNumber ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, quoteNumber: e.target.value }); }} placeholder="2026-001" style={inputStyle} />
            </Field>
            <Field label="Date">
              <input type="date" value={form.date ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, date: e.target.value }); }} style={inputStyle} />
            </Field>
            <Field label="Valid For (days)">
              <input type="number" value={form.validDays ?? 30} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, validDays: parseInt(e.target.value) || 30 }); }} style={inputStyle} />
            </Field>
            <Field label="Tax Rate (%)">
              <input type="number" value={form.taxRate ?? 0} onChange={(e) => onTaxRateChange(parseFloat(e.target.value) || 0)} style={inputStyle} />
            </Field>
            <Field label="Status">
              <select value={form.status ?? "draft"} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, status: e.target.value as Quote["status"] }); }} style={selectStyle}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </Field>
          </div>
        </Card>

        {/* Line Items */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Services / Line Items</h3>
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
                <tr><td colSpan={4} style={{ padding: "20px 8px", color: "var(--text-muted)", fontSize: 12 }}>No items yet. Click &quot;Add Item&quot; to begin.</td></tr>
              ) : (
                (form.items ?? []).map((item, i) => (
                  <tr key={item.id ?? i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 8px", width: "55%" }}>
                      <input value={item.description} onChange={(e) => updateItem(i, "description", e.target.value)} style={{ ...inputStyle, width: "100%" }} placeholder="Service description..." />
                    </td>
                    <td style={{ padding: "6px 8px", width: 80 }}>
                      <input type="number" min={1} value={item.qty} onChange={(e) => updateItem(i, "qty", parseFloat(e.target.value) || 1)} style={{ ...inputStyle, width: "100%" }} />
                    </td>
                    <td style={{ padding: "6px 8px", width: 130 }}>
                      <input type="number" value={item.qty * item.unitPrice} onChange={(e) => updateItem(i, "amount", parseFloat(e.target.value) || 0)} style={{ ...inputStyle, width: "100%", fontFamily: "monospace" }} />
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--status-red)", padding: 2 }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 240 }}>
              <TotalRow label="Subtotal" value={form.subtotal ?? 0} />
              {(form.taxRate ?? 0) > 0 && (
                <TotalRow label={`Tax (${form.taxRate}%)`} value={form.taxAmount ?? 0} />
              )}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontSize: 16, fontWeight: 700, color: "var(--text-primary)", borderTop: "1px solid var(--border)", marginTop: 6 }}>
                <span>Total</span>
                <span style={{ fontFamily: "monospace", color: "var(--beige)" }}>{formatCurrency(form.total ?? 0)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Maintenance & Support Plans (optional, toggled per quote) */}
        <Card>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: form.includeMaintenancePlans ? 14 : 0 }}>
            <input
              type="checkbox"
              checked={form.includeMaintenancePlans ?? false}
              onChange={(e) => { setHasUnsaved(true); setForm({ ...form, includeMaintenancePlans: e.target.checked }); }}
              style={{ marginTop: 3, width: 15, height: 15, accentColor: "var(--beige)", cursor: "pointer" }}
            />
            <div>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Add Maintenance & Support Plans</h3>
              <p style={{ margin: "4px 0 0", fontSize: 11.5, color: "var(--text-muted)" }}>
                {form.includeMaintenancePlans
                  ? "Included in the PDF, after the total and before the terms/notes section."
                  : "Off by default. Turn on to include the maintenance plans section in this quote's PDF."}
              </p>
            </div>
          </label>

          {form.includeMaintenancePlans && (
          <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            {MAINTENANCE_PLANS.map((plan) => (
              <div
                key={plan.name}
                style={{
                  border: plan.featured ? "1.5px solid var(--carbon)" : "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 14,
                  backgroundColor: plan.featured ? "var(--input-bg)" : "var(--bg-card)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {plan.badge && (
                  <span
                    style={{
                      alignSelf: "flex-start",
                      backgroundColor: "var(--carbon)",
                      color: "var(--beige)",
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 4,
                      marginBottom: 8,
                    }}
                  >
                    {plan.badge}
                  </span>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: 0.3 }}>{plan.name}</div>
                <div style={{ margin: "6px 0 10px", display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{plan.price}</span>
                  <span style={{ fontSize: 11.5, color: "var(--text-muted)" }}>{plan.unit}</span>
                </div>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", flex: 1 }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ fontSize: 11.5, color: "var(--text-primary)", lineHeight: 1.6, display: "flex", gap: 6 }}>
                      <span style={{ color: "var(--beige)" }}>•</span> {f}
                    </li>
                  ))}
                </ul>
                {plan.note && (
                  <p style={{ fontSize: 10.5, color: "var(--text-muted)", fontStyle: "italic", lineHeight: 1.5, marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    {plan.note}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Hosting-only, visually separated */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              border: "1px dashed var(--border)",
              borderRadius: 8,
              padding: "12px 16px",
              marginTop: 14,
              backgroundColor: "var(--input-bg)",
            }}
          >
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 }}>
                {HOSTING_ONLY.label}
              </div>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {HOSTING_ONLY.description}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>{HOSTING_ONLY.price}</div>
              <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{HOSTING_ONLY.unit}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, padding: "8px 12px", borderLeft: "2px solid var(--beige)", backgroundColor: "var(--input-bg)", borderRadius: 4 }}>
            <p style={{ margin: 0, fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {MAINTENANCE_DISCLAIMER}
            </p>
          </div>

          <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
            {MAINTENANCE_NOTES.map((n, i) => (
              <li key={i} style={{ fontSize: 10.5, color: "var(--text-muted)", lineHeight: 1.6, display: "flex", gap: 6 }}>
                <span>•</span> {n}
              </li>
            ))}
          </ul>
          </div>
          )}
        </Card>

        {/* Notes */}
        <Card>
          <Field label="Notes / Terms">
            <textarea value={form.notes ?? ""} onChange={(e) => { setHasUnsaved(true); setForm({ ...form, notes: e.target.value }); }} rows={4} placeholder="Payment terms, scope, deposit requirement..." style={{ ...inputStyle, width: "100%", resize: "vertical" }} />
          </Field>
        </Card>
      </div>
    </>
  );
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: "var(--text-muted)" }}>
      <span>{label}</span>
      <span style={{ fontFamily: "monospace" }}>{formatCurrency(value)}</span>
    </div>
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
