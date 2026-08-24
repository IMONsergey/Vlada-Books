import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vlada Books — личная библиотека",
    short_name: "Vlada Books",
    description: "Картотека домашней библиотеки и статистика чтения.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f1e8",
    theme_color: "#6b2838",
    lang: "ru",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
}
