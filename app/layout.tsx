import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Tandem — Get things done, together.",
    template: "%s · Tandem",
  },
  description:
    "A beautifully simple, real-time shared todo board. Create a board, share the link, and get things done together.",
  applicationName: "Tandem",
  keywords: ["todo", "shared todo", "real-time", "collaboration", "tasks"],
};

export const viewport: Viewport = {
  themeColor: "#f5f1e8",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
