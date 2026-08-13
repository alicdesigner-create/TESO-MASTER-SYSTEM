import { NextRequest, NextResponse } from "next/server";
import { getTransactions, saveTransactions, generateId } from "@/lib/data";
import { Transaction } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const dynamic = "force-dynamic";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getTransactions());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const newTx: Transaction = { ...body, id: generateId() };
  saveTransactions([...getTransactions(), newTx]);
  return NextResponse.json(newTx, { status: 201 });
});
