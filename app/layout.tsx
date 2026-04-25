import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beat the Buffet",
  description: "Track your AYCE plate value and beat the buffet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#EF4444",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <main className="mx-auto max-w-md min-h-dvh pb-24">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
