"use client";

import { useState, useEffect } from "react";
import TopBar from "@/components/layout/TopBar";
import Modal from "@/components/ui/Modal";
import Card from "@/components/ui/Card";
import { Client } from "@/lib/types";
import { Plus, Search, User, Mail, Phone, ChevronRight, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [loading, setLoading] = useState(false);

  const load = () => fetch("/api/clients").then((r) => r.json()).then(setClients);
  useEffect(() => { load(); }, []);

  const filtered = clients.filter((c) =>
    `${c.businessName} ${c.contactName} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    setLoading(true);
    try {
      await apiFetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await load();
      setShowForm(false);
      setForm({});
    } catch (err) {
      alert(`No se pudo guardar el cliente. Tus datos siguen en el formulario, intenta de nuevo.\n\n${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm("Delete this client?")) return;
    try {
      await apiFetch(`/api/clients/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(`No se pudo eliminar el cliente.\n\n${(err as Error).message}`);
    }
  };

  return (
    <>
      <TopBar
        title="Clients"
        subtitle={`${clients.length} total`}
        actions={
          <button onClick={() => setShowForm(true)} style={btnPrimary}>
            <Plus size={14} /> New Client
          </button>
        }
      />
      <div style={{ padding: 28 }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: 20, maxWidth: 360 }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              fontSize: 13,
              color: "var(--text-primary)",
            }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: 14 }}>
            {search ? "No clients match your search." : "No clients yet. Add your first client."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {filtered.map((c) => (
              <Card key={c.id} padding={16} style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          backgroundColor: "var(--beige)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--carbon)",
                          flexShrink: 0,
                        }}
                      >
                        {c.businessName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                          {c.businessName}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {c.contactName}
                        </div>
                      </div>
                    </div>
                    {c.email && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        <Mail size={11} />{c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        <Phone size={11} />{c.phone}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => del(c.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                    >
                      <Trash2 size={13} />
                    </button>
                    <Link
                      href={`/clients/${c.id}`}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, display: "flex" }}
                    >
                      <ChevronRight size={13} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setForm({}); }} title="New Client">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Business Name *">
            <input
              value={form.businessName ?? ""}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="Acme Corp"
              style={inputStyle}
            />
          </Field>
          <Field label="Contact Name *">
            <input
              value={form.contactName ?? ""}
              onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              placeholder="John Doe"
              style={inputStyle}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email ?? ""}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@example.com"
              style={inputStyle}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone ?? ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(720) 555-0000"
              style={inputStyle}
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={form.notes ?? ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Optional notes..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button onClick={() => { setShowForm(false); setForm({}); }} style={btnSecondary}>
              Cancel
            </button>
            <button
              onClick={save}
              disabled={!form.businessName || !form.contactName || loading}
              style={btnPrimary}
            >
              {loading ? "Saving..." : "Save Client"}
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
      <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  backgroundColor: "var(--input-bg)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  fontSize: 13,
  color: "var(--text-primary)",
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 18px",
  backgroundColor: "var(--beige)",
  color: "var(--carbon)",
  border: "none",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
};

const btnSecondary: React.CSSProperties = {
  padding: "8px 16px",
  backgroundColor: "transparent",
  color: "var(--text-muted)",
  border: "1px solid var(--border)",
  borderRadius: 5,
  cursor: "pointer",
  fontSize: 13,
};
