import { NextResponse } from "next/server";

import { requireSession } from "@/lib/access";
import { auth } from "@/lib/auth/server";
import { isCheckoutPriceId } from "@/lib/billing/plans";
import { createCheckoutSession } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  let body: { priceId?: unknown };
  try {
    body = (await request.json()) as { priceId?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isCheckoutPriceId(body.priceId)) {
    return NextResponse.json(
      { error: "Invalid or unavailable priceId." },
      { status: 400 },
    );
  }

  const { data: authSession } = await auth.getSession();
  const email = authSession?.user?.email ?? null;

  try {
    const result = await createCheckoutSession({
      userId: session.userId,
      email,
      priceId: body.priceId,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Billing provider unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";

    if (message === "already_subscribed") {
      return NextResponse.json(
        {
          error: "You already have an active Pro subscription.",
          code: "ALREADY_SUBSCRIBED",
        },
        { status: 409 },
      );
    }

    if (message === "invalid" || message === "unavailable") {
      return NextResponse.json(
        { error: "Invalid or unavailable priceId." },
        { status: 400 },
      );
    }

    if (message === "not_configured") {
      return NextResponse.json(
        { error: "Billing provider unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Billing provider unavailable." },
      { status: 503 },
    );
  }
}
