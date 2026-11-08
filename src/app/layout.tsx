import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Conclave",
  description: "Small video meetings with sealed recordings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">{children}</body>
    </html>
  );
}
