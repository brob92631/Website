import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StreamHub",
  description: "Curated live sports streams."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} text-foreground bg-gradient-radial min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
