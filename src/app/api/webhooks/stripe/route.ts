import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/billing/stripe";
import { handleStripeWebhookEvent } from "@/lib/billing/stripe-webhook";

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim().replace(
    /^['"]|['"]$/g,
    "",
  );

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Billing provider unavailable." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const payload = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  try {
    await handleStripeWebhookEvent(event);
  } catch (error) {
    console.error("Stripe webhook handling failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
