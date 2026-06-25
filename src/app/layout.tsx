import type { Metadata } from "next";
import { Inter, Newsreader, JetBrains_Mono } from "next/font/google";
import { AuthSessionSync } from "@/components/layout/AuthSessionSync";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { SchoolProvider } from "@/components/providers/SchoolProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

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
    <html lang="en" className="antialiased">
      <body className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}>
        <AuthSessionSync />
        <QueryProvider>
          <SchoolProvider>{children}</SchoolProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
