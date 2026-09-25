import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "RevenueCat webhooks are deprecated. Use /api/webhooks/stripe and /api/webhooks/apple.",
    },
    { status: 410 },
  );
}
