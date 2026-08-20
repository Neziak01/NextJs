import type { Metadata, Viewport } from "next";
import { Fraunces, Karla } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://brinsauvage.example"),
  title: "BRIN SAUVAGE — Fleuriste artisan à la Croix-Rousse, Lyon",
  description:
    "Fleuriste de quartier depuis 1998. Bouquets composés le matin avec l'arrivage de six producteurs à moins de 80 km, abonnements, mariages et plantes d'intérieur.",
  keywords: [
    "fleuriste Lyon",
    "fleuriste Croix-Rousse",
    "bouquet de saison",
    "abonnement fleurs",
    "fleurs mariage Lyon",
  ],
  openGraph: {
    title: "BRIN SAUVAGE — Là où la saison devient bouquet",
    description:
      "Fleuriste artisan à la Croix-Rousse : bouquets du jour, abonnements et mariages, avec des fleurs cultivées à moins de 80 km.",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/images/og.jpg", width: 1200, height: 630 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#f8f2e7",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${karla.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-paper-50 text-bark-900">{children}</body>
    </html>
  );
}
