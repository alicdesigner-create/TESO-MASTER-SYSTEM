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
  const existing = getTransactions();

  // Avoid double-booking a payment: if this transaction is tied to an
  // invoice that already has a transaction recorded, don't create another one.
  if (body.invoiceId) {
    const duplicate = existing.find((t) => t.invoiceId === body.invoiceId);
    if (duplicate) {
      return NextResponse.json(
        { error: "Ya existe una transacción registrada para este invoice.", duplicate: true, transaction: duplicate },
        { status: 409 }
      );
    }
  }

  const newTx: Transaction = { ...body, id: generateId() };
  saveTransactions([...existing, newTx]);
  return NextResponse.json(newTx, { status: 201 });
});
