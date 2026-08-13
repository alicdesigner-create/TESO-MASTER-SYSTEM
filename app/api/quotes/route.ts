import { NextRequest, NextResponse } from "next/server";
import { getQuotes, saveQuotes, generateId, nextQuoteNumber } from "@/lib/data";
import { Quote } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getQuotes());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const now = body.createdAt ?? new Date().toISOString();
  const newQuote: Quote = {
    ...body,
    id: generateId(),
    quoteNumber: body.quoteNumber || nextQuoteNumber(),
    status: body.status || "draft",
    taxRate: body.taxRate ?? 0,
    taxAmount: body.taxAmount ?? 0,
    validDays: body.validDays ?? 30,
    items: body.items ?? [],
    createdAt: now,
  };
  saveQuotes([...getQuotes(), newQuote]);
  return NextResponse.json(newQuote, { status: 201 });
});
