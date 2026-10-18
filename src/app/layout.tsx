import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Live Waitlist",
  description: "See how long the wait is, join the line, and get pinged when your table is ready.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              🍽️ Live Waitlist
            </Link>
            {/* Plain <a>: the route handler needs a real request to clear the cookie. */}
            <a href="/switch" className="whitespace-nowrap text-sm text-stone-600 hover:text-stone-900">
              Switch role
            </a>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
