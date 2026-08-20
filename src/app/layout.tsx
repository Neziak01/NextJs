import type { Metadata, Viewport } from "next";
import { Anton, Barlow } from "next/font/google";
import "./globals.css";

const anton = Anton({
  variable: "--font-anton",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wildgym.example"),
  title: "WILD GYM — Là où la nature devient ta salle | Ubud, Bali",
  description:
    "Salle de sport premium à ciel ouvert au cœur de la jungle balinaise. 1 400 m² de teck, de bambou et de pierre volcanique, trois formats d'entraînement, essai gratuit 3 jours.",
  keywords: [
    "salle de sport Bali",
    "gym outdoor Ubud",
    "entraînement jungle",
    "wild gym",
  ],
  openGraph: {
    title: "WILD GYM — Là où la nature devient ta salle",
    description:
      "Salle de sport premium à ciel ouvert au cœur de la jungle d'Ubud, Bali.",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/images/og.jpg", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#060d08",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${anton.variable} ${barlow.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-forest-950 text-sand-100">{children}</body>
    </html>
  );
}
