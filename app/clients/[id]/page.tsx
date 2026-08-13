"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { Client, Project, Website, Subscription, Quote } from "@/lib/types";
import { formatCurrency } from "@/lib/finance";
import { formatLocalDate } from "@/lib/date";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, FolderOpen, Globe, RefreshCw, FileText } from "lucide-react";

function quoteStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "accepted":  return { bg: "rgba(58,144,96,0.15)",  text: "var(--status-green)" };
    case "sent":      return { bg: "rgba(59,130,246,0.15)", text: "#3b82f6" };
    case "draft":     return { bg: "rgba(0,0,0,0.06)",      text: "var(--text-muted)" };
    case "declined":  return { bg: "rgba(201,64,64,0.12)",  text: "var(--status-red)" };
    case "expired":   return { bg: "rgba(200,178,153,0.2)", text: "var(--beige)" };
    default:          return { bg: "rgba(0,0,0,0.06)",      text: "var(--text-muted)" };
  }
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [subs, setSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    fetch(`/api/clients/${id}`).then((r) => r.json()).then(setClient);
    fetch("/api/projects").then((r) => r.json()).then((all: Project[]) =>
      setProjects(all.filter((p) => p.clientId === id))
    );
    fetch("/api/quotes").then((r) => r.json()).then((all: Quote[]) =>
      setQuotes(all.filter((q) => q.clientId === id))
    );
    fetch("/api/websites").then((r) => r.json()).then((all: Website[]) =>
      setWebsites(all.filter((w) => w.clientId === id))
    );
    fetch("/api/subscriptions").then((r) => r.json()).then((all: Subscription[]) =>
      setSubs(all.filter((s) => s.clientId === id))
    );
  }, [id]);

  if (!client) return <div style={{ padding: 28, color: "var(--text-muted)" }}>Loading...</div>;

  const totalBilled = projects.reduce((s, p) => s + p.quotedPrice + (p.extraCharge ?? 0), 0);

  return (
    <>
      <TopBar
        title={client.businessName}
        subtitle={client.contactName}
        actions={
          <Link href="/clients" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back
          </Link>
        }
      />
      <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Info */}
        <Card>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  backgroundColor: "var(--beige)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 700,
                  color: "var(--carbon)",
                }}
              >
                {client.businessName.charAt(0).toUpperCase()}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
                {client.businessName}
              </h2>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10 }}>{client.contactName}</div>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {client.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                    <Mail size={12} />{client.email}
                  </div>
                )}
                {client.phone && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--text-muted)" }}>
                    <Phone size={12} />{client.phone}
                  </div>
                )}
              </div>
              {client.notes && (
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                  {client.notes}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Billed</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--beige)", fontFamily: "monospace" }}>
                  {formatCurrency(totalBilled)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Projects */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <FolderOpen size={13} /> Projects ({projects.length})
            </h3>
            <Link href="/projects" style={{ fontSize: 11, color: "var(--beige)", textDecoration: "none" }}>
              Manage →
            </Link>
          </div>
          {projects.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No projects yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Type", "Quoted", "Extra", "Status", "Note"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0 8px 8px 0", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 8px 8px 0", color: "var(--text-primary)" }}>{p.typeOfDesign}</td>
                    <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace", color: "var(--text-muted)" }}>{formatCurrency(p.quotedPrice)}</td>
                    <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace", color: "var(--text-muted)" }}>{p.extraCharge ? formatCurrency(p.extraCharge) : "—"}</td>
                    <td style={{ padding: "8px 8px 8px 0" }}><StatusBadge status={p.status} size="sm" /></td>
                    <td style={{ padding: "8px 0", color: "var(--text-muted)", fontSize: 11 }}>{p.statusNote ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Quotes */}
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={13} /> Quotes ({quotes.length})
            </h3>
            <Link href="/quotes" style={{ fontSize: 11, color: "var(--beige)", textDecoration: "none" }}>
              Manage →
            </Link>
          </div>
          {quotes.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No quotes yet.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Quote #", "Date", "Services", "Total", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0 8px 8px 0", fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 8px 8px 0" }}>
                      <Link href={`/quotes/${q.id}`} style={{ color: "var(--beige)", textDecoration: "none", fontWeight: 500 }}>
                        {q.quoteNumber}
                      </Link>
                    </td>
                    <td style={{ padding: "8px 8px 8px 0", color: "var(--text-muted)", fontSize: 12 }}>
                      {formatLocalDate(q.date)}
                    </td>
                    <td style={{ padding: "8px 8px 8px 0", color: "var(--text-muted)", fontSize: 12, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {q.items.map((i) => i.description).join(", ")}
                    </td>
                    <td style={{ padding: "8px 8px 8px 0", fontFamily: "monospace", color: "var(--text-muted)" }}>
                      {formatCurrency(q.total)}
                    </td>
                    <td style={{ padding: "8px 0" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 10,
                        backgroundColor: quoteStatusColor(q.status).bg,
                        color: quoteStatusColor(q.status).text,
                        textTransform: "capitalize",
                      }}>
                        {q.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Websites */}
        <Card>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={13} /> Websites ({websites.length})
          </h3>
          {websites.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No websites registered.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {websites.map((w) => (
                <div key={w.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <a href={`https://${w.url}`} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: "var(--beige)", textDecoration: "none" }}>{w.url}</a>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{w.type} · {w.maintenanceType !== "none" ? `$${w.maintenanceRate}/${w.maintenanceType}` : "No maintenance"}</div>
                  </div>
                  <StatusBadge status={w.status} size="sm" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Subscriptions */}
        {subs.length > 0 && (
          <Card>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={13} /> Subscriptions ({subs.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {subs.map((s) => (
                <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--text-primary)" }}>{s.service}</span>
                  <span style={{ color: "var(--text-muted)", fontFamily: "monospace" }}>${s.cost}/{s.frequency}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </>
  );
}
