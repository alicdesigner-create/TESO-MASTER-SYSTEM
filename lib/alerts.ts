import { Subscription, Website, Invoice } from "./types";

export interface Alert {
  id: string;
  type: "renewal" | "payment_due" | "overdue_invoice" | "maintenance_due";
  severity: "warning" | "critical";
  message: string;
  daysUntil?: number;
  relatedId: string;
  relatedType: "subscription" | "website" | "invoice";
}

const DAYS_WARNING = 30;
const DAYS_CRITICAL = 7;

function daysBetween(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getSubscriptionAlerts(subscriptions: Subscription[]): Alert[] {
  const alerts: Alert[] = [];
  for (const s of subscriptions) {
    if (!s.renewsOn) continue;
    const days = daysBetween(s.renewsOn);
    if (days <= DAYS_WARNING) {
      alerts.push({
        id: `sub-${s.id}`,
        type: "renewal",
        severity: days <= DAYS_CRITICAL ? "critical" : "warning",
        message: `${s.service} renews in ${days} day${days !== 1 ? "s" : ""} ($${s.renewalCost ?? s.cost})`,
        daysUntil: days,
        relatedId: s.id,
        relatedType: "subscription",
      });
    }
  }
  return alerts;
}

export function getWebsiteMaintenanceAlerts(websites: Website[]): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  for (const w of websites) {
    if (w.status !== "active" || w.maintenanceType === "none") continue;
    const payment = w.monthlyPayments?.[ym];
    if (!payment?.paid) {
      alerts.push({
        id: `web-${w.id}-${ym}`,
        type: "maintenance_due",
        severity: "warning",
        message: `Maintenance pending: ${w.url} — $${w.maintenanceRate ?? 0}`,
        relatedId: w.id,
        relatedType: "website",
      });
    }
  }
  return alerts;
}

export function getInvoiceAlerts(invoices: Invoice[]): Alert[] {
  const alerts: Alert[] = [];
  for (const inv of invoices) {
    if (inv.status === "paid") continue;
    if (!inv.dueDate) continue;
    const days = daysBetween(inv.dueDate);
    if (days < 0) {
      alerts.push({
        id: `inv-${inv.id}`,
        type: "overdue_invoice",
        severity: "critical",
        message: `Invoice ${inv.invoiceNumber} overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""}`,
        daysUntil: days,
        relatedId: inv.id,
        relatedType: "invoice",
      });
    } else if (days <= DAYS_CRITICAL) {
      alerts.push({
        id: `inv-${inv.id}`,
        type: "payment_due",
        severity: "warning",
        message: `Invoice ${inv.invoiceNumber} due in ${days} day${days !== 1 ? "s" : ""}`,
        daysUntil: days,
        relatedId: inv.id,
        relatedType: "invoice",
      });
    }
  }
  return alerts;
}

export function getAllAlerts(
  subscriptions: Subscription[],
  websites: Website[],
  invoices: Invoice[]
): Alert[] {
  return [
    ...getSubscriptionAlerts(subscriptions),
    ...getWebsiteMaintenanceAlerts(websites),
    ...getInvoiceAlerts(invoices),
  ].sort((a, b) => {
    if (a.severity === "critical" && b.severity !== "critical") return -1;
    if (b.severity === "critical" && a.severity !== "critical") return 1;
    return (a.daysUntil ?? 999) - (b.daysUntil ?? 999);
  });
}
