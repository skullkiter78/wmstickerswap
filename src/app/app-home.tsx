"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { appConfig } from "@/lib/app-config";
import { AppFooter } from "./sponsor";
import { AuthPreview } from "./auth-preview";
import { Dashboard } from "./dashboard";
import { PwaRegister } from "./pwa-register";

export function AppHome() {
  const [session, setSession] = useState<Session | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setIsCheckingSession(false);
    }

    loadSession();

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsCheckingSession(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (isCheckingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7fbff] px-5 text-center text-[#172033]">
        <PwaRegister />
        <p className="font-display text-4xl tracking-normal text-[#132a74]">
          Sticker Swap lädt...
        </p>
      </div>
    );
  }

  if (session) {
    return (
      <>
        <PwaRegister />
        <Dashboard session={session} onLogout={() => setSession(null)} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fbff] text-[#172033]">
      <PwaRegister />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-[#132a74] text-lg font-black text-white">
            26
          </div>
          <div>
            <p className="font-display text-2xl leading-none tracking-normal text-[#132a74]">
              {appConfig.appName}
            </p>
            <p className="text-xs font-semibold text-[#e44533]">
              {appConfig.regionLabel}
            </p>
          </div>
        </div>
        <a
          href="#anmelden"
          className="rounded-full bg-[#fed447] px-5 py-3 text-sm font-black text-[#172033] shadow-sm"
        >
          Anmelden
        </a>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{
              backgroundImage: "url('/images/sticker-swap-hero.png')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#f7fbff]/55 via-[#f7fbff]/92 to-[#f7fbff]" />
          <div className="relative mx-auto grid min-h-[calc(100svh-92px)] w-full max-w-6xl content-center gap-8 px-5 pb-12 pt-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
            <div className="max-w-2xl">
              <p className="mb-3 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-[#132a74] shadow-sm ring-1 ring-[#dbe7ff]">
                Lokale WM-2026-Sticker-Tauschbörse
              </p>
              <h1 className="font-display text-6xl leading-[0.9] tracking-normal text-[#132a74] sm:text-7xl">
                Doppelte raus. Fehlende rein.
              </h1>
              <p className="mt-5 text-lg leading-8 text-[#33415c]">
                Sammle smarter im Umkreis Fröndenberg: trage deine doppelten
                Sticker ein, sag was dir fehlt, und finde passende Treffer in
                deinem Bekanntenkreis.
              </p>
              <div className="mt-6 grid gap-3 text-sm font-bold text-[#172033] sm:grid-cols-3">
                <div className="rounded-lg bg-white/85 p-4 shadow-sm ring-1 ring-[#dbe7ff]">
                  1. Doppelte eintragen
                </div>
                <div className="rounded-lg bg-white/85 p-4 shadow-sm ring-1 ring-[#dbe7ff]">
                  2. Suchliste pflegen
                </div>
                <div className="rounded-lg bg-white/85 p-4 shadow-sm ring-1 ring-[#dbe7ff]">
                  3. Treffer finden
                </div>
              </div>
              <div className="relative mt-6 h-40 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#dbe7ff] md:hidden">
                <Image
                  src="/images/sticker-swap-dashboard.png"
                  alt="Fußball-Sticker fliegen um einen Ball"
                  fill
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>

            <AuthPreview onAuthSuccess={setSession} />
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
