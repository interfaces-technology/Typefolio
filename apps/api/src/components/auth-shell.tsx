import type { ReactNode } from "react";

const shell: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 1rem",
  background: "#fafafa",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "24rem",
  background: "#fff",
  border: "1px solid #e5e5e5",
  borderRadius: "0.75rem",
  padding: "1.5rem",
};

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main style={shell}>
      <div style={card}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
          {title}
        </h1>
        <p style={{ margin: "0 0 1.25rem", color: "#525252", fontSize: "0.9375rem" }}>
          {description}
        </p>
        {children}
      </div>
    </main>
  );
}

export const fieldLabel: React.CSSProperties = {
  display: "block",
  fontSize: "0.875rem",
  fontWeight: 500,
  marginBottom: "0.375rem",
};

export const fieldInput: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "0.5rem 0.625rem",
  borderRadius: "0.5rem",
  border: "1px solid #d4d4d4",
  fontSize: "1rem",
};

export const primaryButton: React.CSSProperties = {
  width: "100%",
  marginTop: "0.25rem",
  padding: "0.625rem 1rem",
  borderRadius: "0.5rem",
  border: "none",
  background: "#171717",
  color: "#fff",
  fontSize: "0.9375rem",
  fontWeight: 500,
  cursor: "pointer",
};

export const secondaryButton: React.CSSProperties = {
  ...primaryButton,
  background: "#fff",
  color: "#171717",
  border: "1px solid #d4d4d4",
};

export const errorText: React.CSSProperties = {
  color: "#b91c1c",
  fontSize: "0.875rem",
  margin: "0.5rem 0 0",
};

export const mutedLink: React.CSSProperties = {
  color: "#525252",
  fontSize: "0.875rem",
  textAlign: "center",
  marginTop: "1rem",
};
