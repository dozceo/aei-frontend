import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import { AuthSessionSync } from "@/components/layout/AuthSessionSync";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-headline" });

export const metadata: Metadata = {
  title: "Sankalp AEI",
  description: "Intelligence-driven learning platform frontend",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${manrope.variable}`}>
        <AuthSessionSync />
        {children}
      </body>
    </html>
  );
}
