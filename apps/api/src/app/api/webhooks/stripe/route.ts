import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Stripe webhooks are no longer supported. Use Polar." },
    { status: 410 },
  );
}
