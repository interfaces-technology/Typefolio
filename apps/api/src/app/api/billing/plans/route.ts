import { NextResponse } from "next/server";

import { getPublicBillingPlans } from "@typefolio/core/billing/plans";

export async function GET() {
  return NextResponse.json(getPublicBillingPlans());
}
