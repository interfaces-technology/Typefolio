import { NextResponse } from "next/server";

import { requireSession } from "@/lib/access";
import { createPortalSession } from "@/lib/billing/stripe";

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  try {
    const result = await createPortalSession(session.userId);
    if (!result) {
      return NextResponse.json(
        { error: "Billing provider unavailable." },
        { status: 503 },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    if (message === "no_customer") {
      return NextResponse.json(
        { error: "No Stripe customer on file." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Billing provider unavailable." },
      { status: 503 },
    );
  }
}
