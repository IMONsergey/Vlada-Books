import type { Metadata, Viewport } from "next";
import { PwaRegister } from "./components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vlada Books — личная библиотека",
  description: "Личная книжная картотека, статистика чтения и история домашней библиотеки.",
  applicationName: "Vlada Books",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Vlada Books" },
  icons: { icon: "/favicon.svg", apple: "/favicon.svg" },
  openGraph: { title: "Vlada Books", description: "Личная библиотека, которую приятно вести.", images: ["/og.png"] },
};

export const viewport: Viewport = { themeColor: "#6b2838", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body><PwaRegister />{children}</body></html>;
}
