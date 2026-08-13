import { NextRequest, NextResponse } from "next/server";
import { getClients, saveClients, generateId } from "@/lib/data";
import { Client } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getClients());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const clients = getClients();
  const newClient: Client = {
    ...body,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  saveClients([...clients, newClient]);
  return NextResponse.json(newClient, { status: 201 });
});
