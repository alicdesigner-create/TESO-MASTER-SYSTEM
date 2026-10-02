import { NextRequest, NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/apiHandler";
import { QuoteDefaults } from "@/lib/quoteDefaults";
import { getQuoteDefaults, saveQuoteDefaults } from "@/lib/quoteDefaultsStore";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => NextResponse.json(getQuoteDefaults()));

export const PUT = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json() as QuoteDefaults;
  const pricing = body?.pricing;
  if (!pricing || ![pricing.depositPercent, pricing.monthlyMaintenance, pricing.hourlyRate].every(Number.isFinite)
    || !Array.isArray(body.templates)
    || body.templates.some((template) => !template.id || !template.title || !template.text || !template.category)) {
    return NextResponse.json({ error: "Quote defaults are incomplete or invalid." }, { status: 400 });
  }
  saveQuoteDefaults(body);
  return NextResponse.json(body);
});
