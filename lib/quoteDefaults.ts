import { QuoteCondition, QuotePricing, QuoteServiceCategory } from "./types";

export interface QuoteConditionTemplate extends Omit<QuoteCondition, "id"> {
  id: string;
}

export interface QuoteDefaults {
  pricing: QuotePricing;
  templates: QuoteConditionTemplate[];
}

export const DEFAULT_QUOTE_DEFAULTS: QuoteDefaults = {
  pricing: { depositPercent: 50, monthlyMaintenance: 140, hourlyRate: 35 },
  templates: [
    { id: "general-deposit", category: "general", title: "Deposit and balance", text: "A {depositPercent}% deposit is required to begin. The remaining balance is due upon project completion." },
    { id: "general-validity", category: "general", title: "Quote validity", text: "This quote is valid for {validDays} days." },
    { id: "website-scope", category: "website", title: "Website scope", text: "This quote covers the website services listed above. Services outside this scope require a separate quote." },
    { id: "website-maintenance", category: "website", title: "Monthly maintenance", text: "After project completion, monthly maintenance is {monthlyMaintenance}/month and includes website hosting plus minor adjustments and updates." },
    { id: "website-hourly", category: "website", title: "Structural changes", text: "Structural website changes and work beyond minor updates are billed at {hourlyRate}/hour." },
    { id: "website-domain", category: "website", title: "Domain fees", text: "Domain registration and renewal fees are billed separately." },
    { id: "website-booking", category: "website", title: "Online booking", text: "Online booking functionality is not included unless it is listed in the scope. It can be added later as a separate feature." },
    { id: "print-approval", category: "print", title: "Print approval", text: "Please review and approve the final proof before production begins." },
    { id: "print-refunds", category: "print", title: "Print orders", text: "Print orders are non-refundable once approved and submitted to production." },
    { id: "apparel-approval", category: "apparel", title: "Apparel approval", text: "Production begins after the artwork, garment selection, and quantities are approved." },
    { id: "apparel-changes", category: "apparel", title: "Apparel changes", text: "Changes requested after production approval may affect the price and delivery date." },
    { id: "branding-revisions", category: "branding", title: "Design revisions", text: "Up to 3 revision rounds are included. Additional revisions are billed at {hourlyRate}/hour." },
    { id: "general-final-files", category: "general", title: "Final files", text: "Final files are delivered after the invoice is paid in full." },
  ],
};

export function fillConditionTemplate(
  template: QuoteConditionTemplate,
  pricing: QuotePricing,
  validDays: number
): QuoteCondition {
  const replacements: Record<string, string> = {
    depositPercent: String(pricing.depositPercent),
    monthlyMaintenance: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(pricing.monthlyMaintenance),
    hourlyRate: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(pricing.hourlyRate),
    validDays: String(validDays),
  };
  return {
    id: `${template.id}-${Date.now().toString(36)}`,
    templateId: template.id,
    category: template.category,
    title: template.title,
    text: template.text.replace(/\{(depositPercent|monthlyMaintenance|hourlyRate|validDays)\}/g, (_match, key: string) => replacements[key]),
  };
}

export function inferQuoteCategories(descriptions: string[]): QuoteServiceCategory[] {
  const value = descriptions.join(" ").toLowerCase();
  const categories: QuoteServiceCategory[] = [];
  if (/web|website|site|landing|hosting|domain|booking|online/.test(value)) categories.push("website");
  if (/print|flyer|business card|brochure|banner|sign|poster/.test(value)) categories.push("print");
  if (/apparel|shirt|sleeve|hoodie|garment|uniform|merch/.test(value)) categories.push("apparel");
  if (/logo|brand|identity|graphic|design|social media/.test(value)) categories.push("branding");
  categories.push("general");
  return Array.from(new Set(categories));
}

export const QUOTE_CATEGORY_LABELS: Record<QuoteServiceCategory, string> = {
  website: "Website design",
  print: "Print",
  apparel: "Apparel",
  branding: "Branding and graphic design",
  general: "General",
};
