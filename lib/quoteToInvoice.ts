import { Quote, Invoice, InvoiceItem } from "./types";
import { todayISO, addDaysISO } from "./date";
import { apiFetch } from "./api";

// Quote statuses from which generating an invoice is allowed. "declined" and
// "expired" quotes are excluded — there's nothing to bill.
export const CONVERTIBLE_QUOTE_STATUSES: Quote["status"][] = ["draft", "sent", "accepted"];

/**
 * Converts a quote into a new invoice:
 * - copies every line item (description, qty, unitPrice, amount = qty × unitPrice)
 * - subtotal/total are recalculated from those items
 * - date = today, dueDate = today + 30 days (local time, never UTC-shifted)
 * - stamps the quote with `convertedToInvoiceId` so it can't be duplicated
 *
 * Only ever touches quotes.json by patching `convertedToInvoiceId` on the
 * source quote — no other quote field is sent back to the API.
 */
export async function convertQuoteToInvoice(quote: Quote): Promise<Invoice> {
  const items: InvoiceItem[] = quote.items.map((it) => ({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    description: it.description,
    qty: it.qty,
    unitPrice: it.unitPrice,
    amount: it.qty * it.unitPrice,
  }));
  const subtotal = items.reduce((s, it) => s + it.amount, 0);
  const date = todayISO();
  const dueDate = addDaysISO(date, 30);

  const res = await apiFetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: quote.clientId,
      quoteId: quote.id,
      date,
      dueDate,
      items,
      subtotal,
      total: subtotal,
      status: "unpaid",
    }),
  });
  const created: Invoice = await res.json();

  await apiFetch(`/api/quotes/${quote.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ convertedToInvoiceId: created.id }),
  });

  return created;
}
