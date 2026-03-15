import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.scss";
import LayoutClient from "./layout.client";
import { SITE_URL } from "@/utils/seo";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jumana",
    template: "%s | Jumana",
  },
  description:
    "Jumana — интернет-магазин скромной женской одежды: платья, туники, комплекты, хиджабы и аксессуары в эстетике premium modest fashion.",
  openGraph: {
    title: "Jumana",
    description:
      "Скромная женская одежда Jumana: современный modest fashion, мягкая премиальность и аккуратная эстетика.",
    url: SITE_URL,
    siteName: "Jumana",
    locale: "ru_RU",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
  authModal,
}: Readonly<{
  children: React.ReactNode;
  authModal: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <LayoutClient>
          {children}
          {authModal}
        </LayoutClient>
      </body>
    </html>
  );
}
