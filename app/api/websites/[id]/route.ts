import { NextRequest, NextResponse } from "next/server";
import { getWebsites, saveWebsites } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const sites = getWebsites();
  const idx = sites.findIndex((s) => s.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  sites[idx] = { ...sites[idx], ...body, id: params.id };
  saveWebsites(sites);
  return NextResponse.json(sites[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  saveWebsites(getWebsites().filter((s) => s.id !== params.id));
  return NextResponse.json({ ok: true });
});
