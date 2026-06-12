import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Joe & Elissa Wedding Invitees",
  description: "Wedding invitation groups and invitee details"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
