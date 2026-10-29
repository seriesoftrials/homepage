import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { LocaleScript } from "@/components/i18n/LocaleScript";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { SiteHeader } from "@/components/site/SiteHeader";
import "./globals.css";

const pretendard = localFont({
  src: "./fonts/pretendard-variable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

const instrument = localFont({
  src: [
    { path: "./fonts/instrument-serif-latin-400-normal.woff2", style: "normal" },
    { path: "./fonts/instrument-serif-latin-400-italic.woff2", style: "italic" },
  ],
  variable: "--font-instrument",
  weight: "400",
  display: "swap",
});

const zalando = localFont({
  src: "./fonts/zalando-sans-expanded-semibold.ttf",
  variable: "--font-zalando",
  weight: "600",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SERIAL: 중앙대학교 실전창업학회",
  description: "Series of Trials. 함께 시도하고 경험을 나누며 다음 도전으로 이어가는 중앙대학교 실전창업학회입니다.",
  icons: { icon: "/serial-mark.svg" },
};

export const viewport: Viewport = {
  themeColor: "#101010",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${pretendard.variable} ${instrument.variable} ${zalando.variable}`}
    >
      <head>
        <LocaleScript />
      </head>
      <body>
        <SmoothScroll />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
