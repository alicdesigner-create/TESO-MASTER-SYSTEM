"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { Website, Client, PAYMENT_METHODS } from "@/lib/types";
import { currentYearMonth } from "@/lib/finance";
import { Plus, CheckCircle, Circle, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { todayISO } from "@/lib/date";

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Website | null>(null);
  const [form, setForm] = useState<Partial<Website>>({ maintenanceType: "monthly", status: "active" });
  const [loading, setLoading] = useState(false);

  const ym = currentYearMonth();

  const load = async () => {
    const [w, c] = await Promise.all([
      fetch("/api/websites").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setWebsites(w); setClients(c);
  };
  useEffect(() => { load(); }, []);

  const clientMap: Record<string, { businessName: string }> = {
    alirio: { businessName: "Alirio (Personal)" },
    ...Object.fromEntries(clients.map((c) => [c.id, c])),
  };

  const openNew = () => { setEditTarget(null); setForm({ maintenanceType: "monthly", status: "active" }); setShowForm(true); };
  const openEdit = (w: Website) => { setEditTarget(w); setForm(w); setShowForm(true); };

  const save = async () => {
    setLoading(true);
    try {
      if (editTarget) {
        await apiFetch(`/api/websites/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await apiFetch("/api/websites", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      await load();
      setShowForm(false);
    } catch (err) {
      alert(`No se pudo guardar el sitio web. Tus datos siguen en el formulario, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePayment = async (site: Website) => {
    const current = site.monthlyPayments?.[ym];
    const updated: Website = {
      ...site,
      monthlyPayments: {
        ...site.monthlyPayments,
        [ym]: current?.paid
          ? { amount: site.maintenanceRate ?? 0, paid: false }
          : { amount: site.maintenanceRate ?? 0, paid: true, paidAt: todayISO() },
      },
    };
    try {
      await apiFetch(`/api/websites/${site.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(updated) });
      load();
    } catch (err) {
      alert(`No se pudo actualizar el estado de pago.\n\n${(err as Error).message}`);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this website?")) return;
    try {
      await apiFetch(`/api/websites/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar el sitio web.\n\n${(err as Error).message}`);
    }
  };

  const active = websites.filter((w) => w.status === "active");
  const monthlyRevenue = active.filter((w) => w.maintenanceType === "monthly").reduce((s, w) => s + (w.maintenanceRate ?? 0), 0);
  const pendingThisMonth = active.filter((w) => w.maintenanceType === "monthly" && !w.monthlyPayments?.[ym]?.paid).length;

  return (
    <>
      <TopBar
        title="Websites & Landing Pages"
        subtitle={`${active.length} active · $${monthlyRevenue}/mo · ${pendingThisMonth} pending payment`}
        actions={<button onClick={openNew} style={btnPrimary}><Plus size={14} /> New Website</button>}
      />
      <div style={{ padding: 28 }}>
        <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.03)" }}>
                {["URL", "Client", "Type", "Maintenance", "Day", "Payment", `${ym} Paid?`, "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {websites.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No websites yet.</td></tr>
              ) : (
                websites.map((w) => {
                  const paid = w.monthlyPayments?.[ym]?.paid;
                  return (
                    <tr key={w.id} style={{ borderBottom: "1px solid var(--border)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <a onClick={() => openEdit(w)} style={{ color: "var(--beige)", cursor: "pointer", textDecoration: "none", fontSize: 12 }}>{w.url}</a>
                          <a href={`https://${w.url}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "var(--text-muted)" }}>
                            <ExternalLink size={10} />
                          </a>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{clientMap[w.clientId]?.businessName ?? "—"}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", textTransform: "capitalize" }}>{w.type.replace("_", " ")}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>
                        {w.maintenanceType !== "none" ? `$${w.maintenanceRate}/${w.maintenanceType === "monthly" ? "mo" : "hr"}` : "None"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontFamily: "monospace" }}>{w.maintenanceDay ?? "—"}</td>
                      <td style={{ padding: "10px 14px", color: "var(--text-muted)", fontSize: 11 }}>{w.paymentMethod}</td>
                      <td style={{ padding: "10px 14px" }}>
                        {w.maintenanceType === "monthly" && w.status === "active" ? (
                          <button
                            onClick={() => togglePayment(w)}
                            style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: paid ? "var(--status-green)" : "var(--text-muted)", padding: 0 }}
                          >
                            {paid ? <CheckCircle size={14} /> : <Circle size={14} />}
                            <span style={{ fontSize: 11 }}>{paid ? "Paid" : "Pending"}</span>
                          </button>
                        ) : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px" }}><StatusBadge status={w.status} size="sm" /></td>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={() => del(w.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11 }}>✕</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editTarget ? "Edit Website" : "New Website"} width={600}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="URL *"><input value={form.url ?? ""} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="example.com" style={inputStyle} /></Field>
            <Field label="Client *">
              <select value={form.clientId ?? ""} onChange={(e) => setForm({ ...form, clientId: e.target.value })} style={selectStyle}>
                <option value="">Select...</option>
                <option value="alirio">Alirio (Personal)</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </Field>
            <Field label="Type">
              <select value={form.type ?? "website"} onChange={(e) => setForm({ ...form, type: e.target.value as Website["type"] })} style={selectStyle}>
                <option value="website">Website</option>
                <option value="landing_page">Landing Page</option>
                <option value="digital_card">Digital Card</option>
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status ?? "active"} onChange={(e) => setForm({ ...form, status: e.target.value as Website["status"] })} style={selectStyle}>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </Field>
            <Field label="Initial Cost ($)"><input type="number" value={form.initialCost ?? ""} onChange={(e) => setForm({ ...form, initialCost: parseFloat(e.target.value) })} style={inputStyle} /></Field>
            <Field label="Maintenance Type">
              <select value={form.maintenanceType ?? "monthly"} onChange={(e) => setForm({ ...form, maintenanceType: e.target.value as Website["maintenanceType"] })} style={selectStyle}>
                <option value="monthly">Monthly</option>
                <option value="hourly">Hourly</option>
                <option value="none">None</option>
              </select>
            </Field>
            <Field label="Maintenance Rate ($)"><input type="number" value={form.maintenanceRate ?? ""} onChange={(e) => setForm({ ...form, maintenanceRate: parseFloat(e.target.value) || undefined })} style={inputStyle} /></Field>
            <Field label="Billing Day of Month"><input type="number" min={1} max={31} value={form.maintenanceDay ?? ""} onChange={(e) => setForm({ ...form, maintenanceDay: parseInt(e.target.value) || undefined })} style={inputStyle} /></Field>
            <Field label="Payment Method">
              <select value={form.paymentMethod ?? ""} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} style={selectStyle}>
                <option value="">Select...</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Created At"><input type="date" value={form.createdAt?.slice(0, 10) ?? ""} onChange={(e) => setForm({ ...form, createdAt: e.target.value })} style={inputStyle} /></Field>
          </div>
          <Field label="Notes"><textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={!form.url || !form.clientId || loading} style={btnPrimary}>{loading ? "Saving..." : editTarget ? "Update" : "Save"}</button>
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
