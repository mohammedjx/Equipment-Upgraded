import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Officer Equipment Checkout",
  description: "Badge and QR based officer equipment checkout/check-in",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
