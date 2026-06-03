import type { Metadata, Viewport } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WM Sticker Swap Fröndenberg",
  description:
    "Lokale Tauschbörse für Panini-WM-2026-Sticker im Umkreis Fröndenberg.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Sticker Swap",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#132a74",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${inter.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
