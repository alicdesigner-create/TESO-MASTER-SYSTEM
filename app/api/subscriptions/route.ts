import { NextRequest, NextResponse } from "next/server";
import { getSubscriptions, saveSubscriptions, generateId } from "@/lib/data";
import { Subscription } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getSubscriptions());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const newSub: Subscription = { ...body, id: generateId() };
  saveSubscriptions([...getSubscriptions(), newSub]);
  return NextResponse.json(newSub, { status: 201 });
});
