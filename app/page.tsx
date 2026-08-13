import { getClients, getProjects, getSubscriptions, getWebsites, getTransactions, getInvoices, getQuotes } from "@/lib/data";
import { getAllAlerts } from "@/lib/alerts";
import { ytdSummary, groupByMonth, formatCurrency } from "@/lib/finance";
import { itemStatusColor, ITEM_STATUS_LABELS } from "@/lib/itemStatus";
import { QuoteItemStatus } from "@/lib/types";
import TopBar from "@/components/layout/TopBar";
import AlertBanner from "@/components/ui/AlertBanner";
import Card from "@/components/ui/Card";
import Link from "next/link";
import { Users, FolderOpen, Globe, DollarSign, TrendingUp, TrendingDown, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const clients = getClients();
  const projects = getProjects();
  const quotes = getQuotes();
  const subscriptions = getSubscriptions();
  const websites = getWebsites();
  const transactions = getTransactions();
  const invoices = getInvoices();
  const alerts = getAllAlerts(subscriptions, websites, invoices);
  const ytd = ytdSummary(transactions, 2026);
  const monthly = groupByMonth(transactions);
  const lastMonth = monthly[monthly.length - 1];

  const activeProjects = projects.filter((p) => p.status === "in_progress");
  const pendingProjects = projects.filter((p) => p.status === "pending");
  const activeWebsites = websites.filter((w) => w.status === "active");
  const unpaidInvoices = invoices.filter((i) => i.status === "unpaid" || i.status === "overdue" || i.status === "partial");
  const unpaidTotal = unpaidInvoices.reduce((s, i) => s + i.total, 0);

  const recentServices = quotes
    .flatMap((q) => q.items.map((item) => ({ item, quote: q })))
    .sort((a, b) => b.quote.date.localeCompare(a.quote.date))
    .slice(0, 5);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  return (
    <>
      <TopBar title="Dashboard" subtitle="Teso Graphics LLC — Internal Overview" />
      <div style={{ padding: 28, flex: 1 }}>
        <AlertBanner alerts={alerts} />

        {/* KPI Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <KpiCard
            icon={<TrendingUp size={16} color="var(--status-green)" />}
            label="YTD Income"
            value={formatCurrency(ytd.income)}
            valueColor="var(--status-green)"
          />
          <KpiCard
            icon={<TrendingDown size={16} color="var(--status-red)" />}
            label="YTD Expenses"
            value={formatCurrency(ytd.expenses)}
            valueColor="var(--status-red)"
          />
          <KpiCard
            icon={<DollarSign size={16} color="var(--beige)" />}
            label="Net YTD"
            value={formatCurrency(ytd.net)}
            valueColor={ytd.net >= 0 ? "var(--status-green)" : "var(--status-red)"}
          />
          <KpiCard
            icon={<Clock size={16} color="var(--status-yellow)" />}
            label="Receivables"
            value={formatCurrency(unpaidTotal)}
            valueColor="var(--status-yellow)"
            sub={`${unpaidInvoices.length} invoice${unpaidInvoices.length !== 1 ? "s" : ""}`}
          />
          <KpiCard
            icon={<FolderOpen size={16} color="var(--status-blue)" />}
            label="Active Projects"
            value={String(activeProjects.length)}
            sub={`${pendingProjects.length} pending`}
          />
          <KpiCard
            icon={<Users size={16} color="var(--beige)" />}
            label="Total Clients"
            value={String(clients.length)}
          />
          <KpiCard
            icon={<Globe size={16} color="var(--status-green)" />}
            label="Active Websites"
            value={String(activeWebsites.length)}
          />
        </div>

        {/* Recent Projects */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Recent Services
              </h2>
              <Link
                href="/projects"
                style={{ fontSize: 11, color: "var(--beige)", textDecoration: "none" }}
              >
                View all →
              </Link>
            </div>
            {recentServices.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No services yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {recentServices.map(({ item, quote }) => {
                  const status = (item.status ?? "pending") as QuoteItemStatus;
                  const color = itemStatusColor(status);
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                          {item.description}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                          {clientMap[quote.clientId]?.businessName ?? "Unknown client"}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                          }}
                        >
                          {formatCurrency(item.qty * item.unitPrice)}
                        </span>
                        <span style={{
                          display: "inline-block", padding: "3px 9px", borderRadius: 4,
                          backgroundColor: color.bg, color: color.text,
                          fontSize: 11, fontWeight: 600, letterSpacing: "0.2px", whiteSpace: "nowrap",
                        }}>
                          {ITEM_STATUS_LABELS[status]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Upcoming Alerts */}
          <Card>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                Alerts & Reminders
              </h2>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {alerts.length} total
              </span>
            </div>
            {alerts.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>All clear — no active alerts.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {alerts.slice(0, 6).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 5,
                      backgroundColor: a.severity === "critical" ? "var(--red-bg)" : "var(--yellow-bg)",
                      borderLeft: `3px solid ${a.severity === "critical" ? "var(--red-text)" : "var(--yellow-text)"}`,
                      fontSize: 12,
                      color: a.severity === "critical" ? "var(--red-text)" : "var(--yellow-text)",
                    }}
                  >
                    {a.message}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Month Summary */}
        {lastMonth && (
          <Card style={{ marginTop: 20 }}>
            <h2
              style={{
                margin: "0 0 14px",
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              This Month — {lastMonth.yearMonth}
            </h2>
            <div style={{ display: "flex", gap: 32 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Income</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--status-green)",
                    fontFamily: "monospace",
                  }}
                >
                  {formatCurrency(lastMonth.income)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Expenses</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--status-red)",
                    fontFamily: "monospace",
                  }}
                >
                  {formatCurrency(lastMonth.expenses)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Net</div>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: lastMonth.net >= 0 ? "var(--status-green)" : "var(--status-red)",
                    fontFamily: "monospace",
                  }}
                >
                  {formatCurrency(lastMonth.net)}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
}

function KpiCard({
  icon,
  label,
  value,
  valueColor = "var(--text-primary)",
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <Card padding={16}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: valueColor, fontFamily: "monospace" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}
