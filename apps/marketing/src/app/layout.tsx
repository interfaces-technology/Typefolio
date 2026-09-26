import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Typefolio — Your fonts, on every device",
  description:
    "Upload font files once. Sync and install on Mac and iPad.",
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          color: "#171717",
          background: "#fafafa",
        }}
      >
        {children}
      </body>
    </html>
  );
}
