import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Great_Vibes,
  Montserrat
} from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joe & Elissa Wedding Invitees",
  description: "Wedding invitation groups and invitee details"
};

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const scriptFont = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-script",
  weight: "400"
});

const bodyFont = Montserrat({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"]
});

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${displayFont.variable} ${scriptFont.variable} ${bodyFont.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
