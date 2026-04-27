import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BookMe | AI front desk for independent hotels",
  description:
    "BookMe lets hotel guests book, check in, and check out through one AI front-desk conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
