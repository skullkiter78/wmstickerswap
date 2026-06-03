"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) =>
          registrations.forEach((registration) => registration.unregister()),
        )
        .catch(() => {
          // Lokal darf die App auch ohne Service-Worker-Aufraeumen laufen.
        });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Installierbarkeit bleibt auch ohne Offline-Cache nutzbar.
    });
  }, []);

  return null;
}
