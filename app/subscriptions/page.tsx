"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import { Subscription, Client, PAYMENT_METHODS } from "@/lib/types";
import { Plus, AlertTriangle, Eye, EyeOff, ExternalLink } from "lucide-react";
import Card from "@/components/ui/Card";
import { apiFetch } from "@/lib/api";

function daysUntil(dateStr?: string): number | null {
  if (!dateStr || dateStr.toLowerCase().includes("every") || dateStr.toLowerCase().includes("monthly")) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [form, setForm] = useState<Partial<Subscription>>({ frequency: "annual" });
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const load = async () => {
    const [s, c] = await Promise.all([
      fetch("/api/subscriptions").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ]);
    setSubs(s); setClients(c);
  };
  useEffect(() => { load(); }, []);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const allOwners = [{ id: "alirio", businessName: "Alirio — Teso Graphics (Personal)" }, ...clients];

  const togglePassword = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openNew = () => { setEditTarget(null); setForm({ frequency: "annual" }); setIsDirty(false); setShowForm(true); };
  const openEdit = (s: Subscription) => { setEditTarget(s); setForm(s); setIsDirty(false); setShowForm(true); };

  const handleClose = () => {
    if (isDirty && !confirm("¿Salir sin guardar los cambios?")) return;
    setShowForm(false);
    setIsDirty(false);
  };

  const save = async () => {
    setLoading(true);
    try {
      if (editTarget) {
        await apiFetch(`/api/subscriptions/${editTarget.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      } else {
        await apiFetch("/api/subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      }
      await load();
      setShowForm(false);
      setIsDirty(false);
    } catch (err) {
      alert(`No se pudo guardar la suscripción. Tus datos siguen en el formulario, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this subscription?")) return;
    try {
      await apiFetch(`/api/subscriptions/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar la suscripción.\n\n${(err as Error).message}`);
    }
  };

  // Group subs by clientId
  const grouped = new Map<string, Subscription[]>();
  for (const s of subs) {
    const key = s.clientId;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(s);
  }

  // Sort groups: alirio first, then alphabetical by business name
  const sortedOwnerIds = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "alirio") return -1;
    if (b === "alirio") return 1;
    return (clientMap[a]?.businessName ?? "").localeCompare(clientMap[b]?.businessName ?? "");
  });

  const totalMonthly = subs.filter((s) => s.frequency === "monthly").reduce((t, s) => t + s.cost, 0);

  const clientOptions = [{ id: "alirio", businessName: "Alirio (Personal — Teso)" }, ...clients];

  return (
    <>
      <TopBar
        title="Subscriptions"
        subtitle={`${subs.length} subscriptions · $${totalMonthly.toFixed(2)}/mo recurring`}
        actions={<button onClick={openNew} style={btnPrimary}><Plus size={14} /> New Subscription</button>}
      />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {sortedOwnerIds.map((ownerId) => {
          const ownerSubs = grouped.get(ownerId) ?? [];
          const ownerName = ownerId === "alirio" ? "Alirio — Teso Graphics (Personal)" : (clientMap[ownerId]?.businessName ?? ownerId);
          const ownerSorted = [...ownerSubs].sort((a, b) => {
            const da = daysUntil(a.renewsOn) ?? 9999;
            const db = daysUntil(b.renewsOn) ?? 9999;
            return da - db;
          });

          return (
            <Card key={ownerId} padding={0}>
              {/* Group header */}
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "var(--beige)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--carbon)", flexShrink: 0 }}>
                  {ownerName.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{ownerName}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>{ownerSubs.length} subscription{ownerSubs.length !== 1 ? "s" : ""}</span>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", backgroundColor: "rgba(0,0,0,0.03)" }}>
                    {["Service", "Cost", "Freq.", "Renews On", "Payment", "Admin Email", "Password", "Billing URL", "Note", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ownerSorted.map((s) => {
                    const days = daysUntil(s.renewsOn);
                    const isWarning = days !== null && days <= 30 && days > 7;
                    const isCritical = days !== null && days <= 7;
                    const showPw = visiblePasswords.has(s.id);

                    return (
                      <tr key={s.id} onClick={() => openEdit(s)} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.015)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "")}>
                        <td style={{ padding: "9px 12px", color: "var(--text-primary)", fontWeight: 500 }}>{s.service}</td>
                        <td style={{ padding: "9px 12px", fontFamily: "monospace", color: "var(--text-muted)" }}>${s.cost}</td>
                        <td style={{ padding: "9px 12px", color: "var(--text-muted)", textTransform: "capitalize" }}>{s.frequency}</td>
                        <td style={{ padding: "9px 12px" }}>
                          {s.renewsOn ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4, color: isCritical ? "var(--status-red)" : isWarning ? "var(--status-yellow)" : "var(--text-muted)", fontSize: 11 }}>
                              {(isCritical || isWarning) && <AlertTriangle size={10} />}
                              {s.renewsOn}
                              {days !== null && <span style={{ fontSize: 10 }}>({days}d)</span>}
                            </span>
                          ) : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--text-muted)", fontSize: 11, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.paymentMethod ?? "—"}</td>
                        <td style={{ padding: "9px 12px", color: "var(--text-muted)", fontSize: 11 }}>{s.adminEmail ?? "—"}</td>
                        <td style={{ padding: "9px 12px" }}>
                          {s.adminPassword ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); togglePassword(s.id); }}
                              style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}
                            >
                              {showPw
                                ? <><EyeOff size={11} /><span style={{ fontSize: 11, fontFamily: "monospace" }}>{s.adminPassword}</span></>
                                : <><Eye size={11} /><span style={{ fontSize: 11 }}>••••••••</span></>
                              }
                            </button>
                          ) : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          {s.billingUrl && s.billingUrl !== "NA" ? (
                            <a href={s.billingUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ color: "var(--beige)", display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11 }}>
                              <ExternalLink size={10} /> Open
                            </a>
                          ) : <span style={{ color: "var(--text-muted)", fontSize: 11 }}>—</span>}
                        </td>
                        <td style={{ padding: "9px 12px", color: "var(--text-muted)", fontSize: 11, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s.renewalNote ?? s.notes ?? "—"}
                        </td>
                        <td style={{ padding: "9px 12px" }}>
                          <button onClick={(e) => { e.stopPropagation(); del(s.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 11 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          );
        })}

        {subs.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 14 }}>
            No subscriptions yet.
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={handleClose} title={editTarget ? "Edit Subscription" : "New Subscription"} width={640}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Service *"><input value={form.service ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, service: e.target.value }); }} placeholder="Domain, Google Workspace..." style={inputStyle} /></Field>
            <Field label="Client / Owner *">
              <select value={form.clientId ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, clientId: e.target.value }); }} style={selectStyle}>
                <option value="">Select...</option>
                {clientOptions.map((c) => <option key={c.id} value={c.id}>{c.businessName}</option>)}
              </select>
            </Field>
            <Field label="Cost ($) *"><input type="number" value={form.cost ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, cost: parseFloat(e.target.value) }); }} style={inputStyle} /></Field>
            <Field label="Frequency *">
              <select value={form.frequency ?? "annual"} onChange={(e) => { setIsDirty(true); setForm({ ...form, frequency: e.target.value as Subscription["frequency"] }); }} style={selectStyle}>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
                <option value="biennial">Biennial</option>
                <option value="one_time">One Time</option>
                <option value="included">Included</option>
              </select>
            </Field>
            <Field label="Purchase Date"><input type="date" value={form.purchaseDate ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, purchaseDate: e.target.value }); }} style={inputStyle} /></Field>
            <Field label="Renews On"><input value={form.renewsOn ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, renewsOn: e.target.value }); }} placeholder="2027-03-14 or Monthly" style={inputStyle} /></Field>
            <Field label="Renewal Cost ($)"><input type="number" value={form.renewalCost ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, renewalCost: parseFloat(e.target.value) || undefined }); }} style={inputStyle} /></Field>
            <Field label="Payment Method">
              <select value={form.paymentMethod ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, paymentMethod: e.target.value }); }} style={selectStyle}>
                <option value="">Select...</option>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>
            <Field label="Billing URL"><input value={form.billingUrl ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, billingUrl: e.target.value }); }} placeholder="https://..." style={inputStyle} /></Field>
            <Field label="Admin Email"><input value={form.adminEmail ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, adminEmail: e.target.value }); }} style={inputStyle} /></Field>
            <Field label="Admin Password"><input value={form.adminPassword ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, adminPassword: e.target.value }); }} placeholder="Stored locally, not shared" style={inputStyle} /></Field>
            <div />
          </div>
          <Field label="Renewal Note"><input value={form.renewalNote ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, renewalNote: e.target.value }); }} placeholder="e.g. Charge Andres (every 1 year)" style={{ ...inputStyle, width: "100%" }} /></Field>
          <Field label="Notes"><textarea value={form.notes ?? ""} onChange={(e) => { setIsDirty(true); setForm({ ...form, notes: e.target.value }); }} rows={2} style={{ ...inputStyle, width: "100%", resize: "vertical" }} /></Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
            <button onClick={handleClose} style={btnSecondary}>Cancel</button>
            <button onClick={save} disabled={!form.service || !form.clientId || loading} style={btnPrimary}>{loading ? "Saving..." : editTarget ? "Update" : "Save"}</button>
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
