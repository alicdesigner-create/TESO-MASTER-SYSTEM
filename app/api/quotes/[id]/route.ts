import { NextRequest, NextResponse } from "next/server";
import { getQuotes, saveQuotes } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const quote = getQuotes().find((q) => q.id === params.id);
  if (!quote) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(quote);
});

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const quotes = getQuotes();
  const idx = quotes.findIndex((q) => q.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  quotes[idx] = { ...quotes[idx], ...body, id: params.id, updatedAt: new Date().toISOString() };
  saveQuotes(quotes);
  return NextResponse.json(quotes[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  saveQuotes(getQuotes().filter((q) => q.id !== params.id));
  return NextResponse.json({ ok: true });
});
