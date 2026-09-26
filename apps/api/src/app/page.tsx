import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export default function ApiHomePage() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>Typefolio API</h1>
      <p>JSON routes live under /api/*</p>
    </main>
  );
}

export async function generateMetadata() {
  return { title: "Typefolio API" };
}
