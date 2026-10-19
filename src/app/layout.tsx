import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { OfflineBanner } from "@/components/ui/offline-banner";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.RENDER_EXTERNAL_URL ?? "http://localhost:3100";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "STHIRA — йога, которая знает, что тебе делать сегодня",
    template: "%s — STHIRA",
  },
  description:
    "Авторская школа хатха-йоги Марии Васильевой: видеопрактики, программы, прогресс и AI-наставник. Практика с понятным маршрутом и уважением к вашему темпу.",
  applicationName: "STHIRA",
  keywords: ["хатха-йога", "йога онлайн", "йога дома", "практика йоги", "STHIRA", "Мария Васильева"],
  authors: [{ name: "STHIRA" }],
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: appUrl,
    siteName: "STHIRA",
    title: "STHIRA — йога, которая знает, что тебе делать сегодня",
    description:
      "Персональный путь в хатха-йоге: практики под твою цель, понятная система занятий и поддержка на каждом этапе.",
    images: [{ url: "/images/og.jpg", width: 1200, height: 630, alt: "STHIRA — авторская школа хатха-йоги" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "STHIRA — йога, которая знает, что тебе делать сегодня",
    description: "Авторская школа хатха-йоги Марии Васильевой.",
    images: ["/images/og.jpg"],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f3f0e8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <OfflineBanner />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
