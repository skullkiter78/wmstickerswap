import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WM Sticker Swap Fröndenberg",
    short_name: "Sticker Swap",
    description:
      "Lokale Tauschbörse für WM-2026-Sticker im Umkreis Fröndenberg.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7fbff",
    theme_color: "#132a74",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
