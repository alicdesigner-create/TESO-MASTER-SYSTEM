import { NextRequest, NextResponse } from "next/server";
import { getWebsites, saveWebsites, generateId } from "@/lib/data";
import { Website } from "@/lib/types";
import { withErrorHandling } from "@/lib/apiHandler";

export const GET = withErrorHandling(async () => {
  return NextResponse.json(getWebsites());
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json();
  const newSite: Website = { ...body, id: generateId(), monthlyPayments: body.monthlyPayments ?? {} };
  saveWebsites([...getWebsites(), newSite]);
  return NextResponse.json(newSite, { status: 201 });
});
