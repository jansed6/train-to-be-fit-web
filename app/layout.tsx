import "./globals.css";
import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Train to be fit",
  description: "Simple offline-first strength training tracker.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Train to be fit",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#ff7a1b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
