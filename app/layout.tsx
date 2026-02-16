import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Agentible | AI that converts leads and makes you money",
  description:
    "An AI Employee that puts in the work 24/7, turning leads into loyal customers. Automated SDR Lead Generation, Qualification, Enrichment, Research, Routing & Follow-Up.",
  openGraph: {
    title: "Agentible | AI that converts leads and makes you money",
    url: "https://agentible.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body
        className={`${inter.className} min-h-screen bg-[#0f1419] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
