import { NextRequest, NextResponse } from "next/server";
import { getInvoices, saveInvoices, generateId, nextInvoiceNumber } from "@/lib/data";
import { Invoice } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getInvoices());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const now = new Date().toISOString();
  const newInvoice: Invoice = {
    ...body,
    id: generateId(),
    invoiceNumber: body.invoiceNumber ?? nextInvoiceNumber(),
    status: body.status || "unpaid",
    items: body.items ?? [],
    createdAt: now,
  };
  saveInvoices([...getInvoices(), newInvoice]);
  return NextResponse.json(newInvoice, { status: 201 });
});
