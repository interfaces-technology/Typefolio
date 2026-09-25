import { NextResponse } from "next/server";

import { handleAppleWebhookBody } from "@/lib/billing/apple-webhook";

export async function POST(request: Request) {
  let body: { signedPayload?: string };
  try {
    body = (await request.json()) as { signedPayload?: string };
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  try {
    await handleAppleWebhookBody(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "apple_not_configured") {
      return NextResponse.json(
        { error: "Apple billing not configured." },
        { status: 503 },
      );
    }

    console.error("Apple webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
