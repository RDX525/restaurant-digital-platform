import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kāti — Restaurant Platform",
    template: "%s | Kāti",
  },
  description:
    "Premium restaurant websites and menu management for Aotearoa New Zealand hospitality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NZ" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
