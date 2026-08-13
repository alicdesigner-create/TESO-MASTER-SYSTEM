import { NextRequest, NextResponse } from "next/server";
import { getInvoices, saveInvoices } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const inv = getInvoices().find((i) => i.id === params.id);
  if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(inv);
});

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const invoices = getInvoices();
  const idx = invoices.findIndex((i) => i.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  invoices[idx] = { ...invoices[idx], ...body, id: params.id, updatedAt: new Date().toISOString() };
  saveInvoices(invoices);
  return NextResponse.json(invoices[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  saveInvoices(getInvoices().filter((i) => i.id !== params.id));
  return NextResponse.json({ ok: true });
});
