import { NextRequest, NextResponse } from "next/server";
import { getSubscriptions, saveSubscriptions } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const subs = getSubscriptions();
  const idx = subs.findIndex((s) => s.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  subs[idx] = { ...subs[idx], ...body, id: params.id };
  saveSubscriptions(subs);
  return NextResponse.json(subs[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  saveSubscriptions(getSubscriptions().filter((s) => s.id !== params.id));
  return NextResponse.json({ ok: true });
});
