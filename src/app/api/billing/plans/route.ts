import { NextResponse } from "next/server";

import { getPublicBillingPlans } from "@/lib/billing/plans";

export async function GET() {
  return NextResponse.json(getPublicBillingPlans());
}
