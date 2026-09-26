import type { CSSProperties } from "react";

function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:43123";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

const primaryLink: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "0.5rem",
  background: "#171717",
  padding: "0.625rem 1.25rem",
  fontSize: "0.875rem",
  fontWeight: 500,
  color: "#fff",
  textDecoration: "none",
};

const secondaryLink: CSSProperties = {
  ...primaryLink,
  background: "#fff",
  color: "#171717",
  border: "1px solid #d4d4d4",
};

export default function MarketingHomePage() {
  return (
    <div
      style={{
        margin: "0 auto",
        display: "flex",
        minHeight: "100vh",
        maxWidth: "48rem",
        flexDirection: "column",
        justifyContent: "center",
        gap: "2.5rem",
        padding: "5rem 1.5rem",
      }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.875rem",
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            color: "#737373",
          }}
        >
          Typefolio
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
          }}
        >
          Your fonts, on every device.
        </h1>
        <p style={{ margin: 0, fontSize: "1.125rem", color: "#525252" }}>
          Personal cloud storage for your typefaces. Upload once, sync to Mac and
          iPad — no marketplace, no zip bundles.
        </p>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        <a href={apiUrl("/auth/sign-up")} style={primaryLink}>
          Create account
        </a>
        <a href={apiUrl("/auth/desktop")} style={secondaryLink}>
          Sign in (Mac / iPad)
        </a>
      </div>

      <p style={{ margin: 0, fontSize: "0.875rem", color: "#737373" }}>
        The signed-in web library is being redesigned in Figma. Use the macOS app to
        sync fonts after you create an account.
      </p>
    </div>
  );
}
