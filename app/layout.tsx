import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guts — Figurine 3D",
  description: "Figurine 3D procédurale de Guts, le Guerrier Noir.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
