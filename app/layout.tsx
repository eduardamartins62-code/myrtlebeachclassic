import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Myrtle Beach Classic 2026",
  description: "Live leaderboard and scoring for Myrtle Beach Classic 2026."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900">
        <div className="min-h-screen bg-gradient-to-b from-pine-50 via-white to-white">
          {children}
        </div>
      </body>
    </html>
  );
}
