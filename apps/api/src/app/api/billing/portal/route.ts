import { NextResponse } from "next/server";

import { requireSession } from "@typefolio/core/access";
import { createPortalSession } from "@typefolio/core/billing/polar";

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
  } catch {
    return NextResponse.json(
      { error: "Billing provider unavailable." },
      { status: 503 },
    );
  }
}
