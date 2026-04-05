import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { PremiumBackground } from "@/components/PremiumBackground";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "BudgetFacile | Votre Richesse, Raffinée",
  description: "Désormais, votre patrimoine est sous contrôle. Intuition, élégance, et précision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      translate="no"
      className={cn("dark font-sans", geist.variable)}
    >
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={cn("relative min-h-screen bg-[var(--primary-bg)]")}>
        <PremiumBackground />
        <div className="relative z-10 min-h-screen">{children}</div>
      </body>
    </html>
  );
}
