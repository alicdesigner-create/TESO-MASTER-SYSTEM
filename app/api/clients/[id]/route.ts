import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const client = getClients().find((c) => c.id === params.id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
});

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const clients = getClients();
  const idx = clients.findIndex((c) => c.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  clients[idx] = { ...clients[idx], ...body, id: params.id };
  saveClients(clients);
  return NextResponse.json(clients[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  const clients = getClients().filter((c) => c.id !== params.id);
  saveClients(clients);
  return NextResponse.json({ ok: true });
});
