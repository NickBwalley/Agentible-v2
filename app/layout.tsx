import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Agentible.dev",
  icons: {
    icon: "/logo/Agentible-logo.jpeg",
  },
  description:
    "Cold Outreach Automation Platform for B2B Sales and Marketing Teams.",
  openGraph: {
    title: "Agentible.dev",
    description:
      "Cold Outreach Automation Platform for B2B Sales and Marketing Teams.",
    url: "https://agentible.dev",
    images: [
      {
        url: "https://agentible.dev/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
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
