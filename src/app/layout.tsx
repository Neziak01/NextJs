import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Jarvis — Poste de commandement",
  description:
    "Supervision des agents IA, suivi des projets et mémoire commune évolutive.",
};

const NAV = [
  { href: "/", label: "Commandement" },
  { href: "/agents", label: "Agents" },
  { href: "/projects", label: "Projets" },
  { href: "/memory", label: "Mémoire" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}>
        <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--bg)_88%,transparent)] backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="relative grid size-8 place-items-center rounded-full border border-[var(--accent-dim)] text-[var(--accent)]">
                <span className="size-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)]" />
              </span>
              <span className="text-[15px] font-semibold tracking-[0.2em]">JARVIS</span>
            </Link>
            <nav className="flex flex-wrap items-center gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-1.5 text-[var(--muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text)]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
