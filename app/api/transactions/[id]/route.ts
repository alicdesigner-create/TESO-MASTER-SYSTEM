import { NextRequest, NextResponse } from "next/server";
import { getTransactions, saveTransactions } from "@/lib/data";
import { withErrorHandling } from "@/lib/apiHandler";

export const PUT = withErrorHandling(async (req: NextRequest, { params }: { params: { id: string } }) => {
  const body = await req.json();
  const txs = getTransactions();
  const idx = txs.findIndex((t) => t.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  txs[idx] = { ...txs[idx], ...body, id: params.id };
  saveTransactions(txs);
  return NextResponse.json(txs[idx]);
});

export const DELETE = withErrorHandling(async (_: NextRequest, { params }: { params: { id: string } }) => {
  saveTransactions(getTransactions().filter((t) => t.id !== params.id));
  return NextResponse.json({ ok: true });
});
