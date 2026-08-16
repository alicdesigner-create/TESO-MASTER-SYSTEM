export interface Client {
  id: string;
  businessName: string;
  contactName: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  clientId: string;
  typeOfDesign: string;
  status: "pending" | "in_progress" | "done" | "cancelled";
  statusNote?: string;
  quotedPrice: number;
  extraCharge?: number;
  extraChargeNote?: string;
  paymentNote?: string;
  quoteId?: string;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  clientId: string;
  service: string;
  billingUrl?: string;
  purchaseDate: string;
  cost: number;
  frequency: "monthly" | "annual" | "biennial" | "one_time" | "included";
  paymentMethod: string;
  renewsOn?: string;
  renewalCost?: number;
  renewalNote?: string;
  adminEmail?: string;
  adminPassword?: string;
  notes?: string;
}

export interface Website {
  id: string;
  clientId: string;
  url: string;
  type: "website" | "landing_page" | "digital_card";
  createdAt: string;
  initialCost: number;
  maintenanceType: "monthly" | "hourly" | "none";
  maintenanceRate?: number;
  maintenanceDay?: number;
  paymentMethod: string;
  status: "active" | "cancelled" | "paused";
  cancelledAt?: string;
  notes?: string;
  monthlyPayments: {
    [yearMonth: string]: {
      amount: number;
      paid: boolean;
      paidAt?: string;
    };
  };
}

export interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  description?: string;
  clientId?: string;
  projectId?: string;
  invoiceId?: string;
  paymentMethod?: string;
  vendor?: string;
  notes?: string;
}

export type QuoteItemStatus = "pending" | "approved" | "in_progress" | "done" | "rejected";

export interface QuoteItem {
  id: string;
  qty: number;
  description: string;
  unitPrice: number;
  status?: QuoteItemStatus;
}

export interface Quote {
  id: string;
  quoteNumber: string;           // formato "2026-001"
  clientId: string;
  date: string;
  validDays: number;             // default 30
  items: QuoteItem[];
  subtotal: number;
  taxRate: number;               // default 0
  taxAmount: number;
  total: number;
  notes?: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
  convertedToInvoiceId?: string;
  createdAt: string;
  includeMaintenancePlans?: boolean; // default false — toggles the Maintenance & Support Plans section
  selectedMaintenancePlans?: string[]; // ids of plans marked as selected/included (see lib/maintenancePlans.ts); purely visual — does not affect pricing/totals
}

export interface InvoiceItem {
  id: string;
  description: string;
  qty?: number;
  unitPrice?: number;
  amount: number;                // siempre requerido (puede ser qty * unitPrice o fijo)
}

export interface Invoice {
  id: string;
  invoiceNumber: number | string; // e.g. 2026-15
  clientId: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  status: "unpaid" | "paid" | "overdue" | "partial";
  paidAt?: string;
  paidAmount?: number;
  depositAmount?: number;        // deposito / pago parcial recibido, reduce el balance due
  notes?: string;
  quoteId?: string;
  createdAt: string;
}

// ---- Status type aliases ----
export type ProjectStatus = Project["status"];
export type SubscriptionFrequency = Subscription["frequency"];
export type WebsiteStatus = Website["status"];
export type TransactionType = Transaction["type"];
export type QuoteStatus = Quote["status"];
export type InvoiceStatus = Invoice["status"];

// ---- Enums / lists ----
export const INCOME_CATEGORIES = [
  "Web Design – New Clients",
  "Web Design – Recurring / Maintenance",
  "Landing Pages",
  "Logo & Branding",
  "Social Media Design",
  "Print Design",
  "Merchandising",
  "Operational Documents (Excel/PDF)",
  "Consulting / Strategy",
  "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
  "Adobe Creative Cloud",
  "ChatGPT (subscriptions)",
  "Claude AI / (subscriptions)",
  "GitHub / Vercel / Hosting",
  "Domain Names",
  "Google Workspace",
  "Marketing & Advertising",
  "Website Costs (own site)",
  "Printing Business Cards / Flyers",
  "Office Supplies",
  "Telephone & Internet",
  "Professional Development / Courses",
  "Bank Fees & Payment Processing",
  "Accounting / Tax Prep Fees",
  "Legal & Professional Services",
  "Business Insurance",
  "Mileage / Transportation",
  "Meals & Entertainment (business)",
  "Miscellaneous / Other",
] as const;

export const DESIGN_TYPES = [
  "Web Design",
  "Landing Page",
  "Logo & Branding",
  "Logo Design",
  "Social Media Design",
  "Print Design",
  "Flyer",
  "Business Cards",
  "Banner",
  "Vehicle Wrap Design",
  "Sign Design",
  "Google Business Profile Setup",
  "Corporate Email Setup",
  "Domain Purchase",
  "Operational Documents",
  "Consulting",
  "Other",
] as const;

export const PAYMENT_METHODS = [
  "Visa 8985 (Teso)",
  "Visa 9854 (personal)",
  "Dulce",
  "Cash",
  "Zelle",
  "PayPal",
  "Check",
  "Other",
] as const;
