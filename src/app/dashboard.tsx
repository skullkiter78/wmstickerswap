"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import Image from "next/image";
import { BrowseOffers } from "./browse-offers";
import { MatchFinder } from "./match-finder";
import { NotificationBanner } from "./notification-banner";
import { Onboarding } from "./onboarding";
import { ProfileSettings } from "./profile-settings";
import { AppFooter, SponsorCard, VoucherBanner } from "./sponsor";
import { StickerManager } from "./sticker-manager";

type DashboardProps = {
  session: Session;
  onLogout: () => void;
};

type Profile = {
  nickname: string;
  ort: string;
  kontakt_email: string | null;
  onboarding_abgeschlossen: boolean;
};

export function Dashboard({ session, onLogout }: DashboardProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("nickname, ort, kontakt_email, onboarding_abgeschlossen")
        .eq("id", session.user.id)
        .single();

      setProfile(data);
      setIsLoading(false);
    }

    loadProfile();
  }, [session.user.id]);

  async function handleLogout() {
    await supabase.auth.signOut();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-[#f7fbff] text-[#172033]">
      <Onboarding
        userId={session.user.id}
        show={!isLoading && profile?.onboarding_abgeschlossen === false}
        onDone={() =>
          setProfile((current) =>
            current ? { ...current, onboarding_abgeschlossen: true } : current,
          )
        }
      />
      <header className="sticky top-0 z-10 border-b border-[#dbe7ff] bg-white/95 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="font-display text-3xl leading-none tracking-normal text-[#132a74]">
              Sticker Swap
            </p>
            <p className="text-xs font-bold text-[#e44533]">
              Dein Dashboard
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="h-12 rounded-lg border-2 border-[#132a74] px-4 text-sm font-black text-[#132a74]"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6">
        <section className="relative overflow-hidden rounded-lg bg-[#132a74] p-5 text-white shadow-sm">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: "url('/images/sticker-swap-dashboard.png')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#132a74] via-[#132a74]/88 to-[#132a74]/35" />
          <div className="relative">
            <p className="text-sm font-bold text-[#fed447]">
              Willkommen zurück
            </p>
            <h1 className="mt-2 font-display text-5xl leading-none tracking-normal">
              {isLoading
                ? "Lade Profil..."
                : `Hallo ${profile?.nickname ?? "Sammler"}`}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/85">
              Ort: {profile?.ort ?? "noch nicht geladen"} · Login:{" "}
              {session.user.email}
            </p>
          </div>
        </section>

        <NotificationBanner userId={session.user.id} refreshKey={refreshKey} />

        <VoucherBanner />

        <section className="grid overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#dbe7ff] md:grid-cols-[0.95fr_1.05fr]">
          <div className="p-5">
            <p className="text-sm font-bold text-[#e44533]">
              Sammelrunde Fröndenberg
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#132a74]">
              So fühlt sich Tauschen nach Sommerturnier an.
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5d6b86]">
              Doppelte sortieren, Suchliste pflegen, Treffer finden: alles hier
              in deiner kleinen lokalen Sticker-Zentrale.
            </p>
          </div>
          <div className="relative h-56 md:h-full">
            <Image
              src="/images/sticker-swap-hero.png"
              alt="Sticker-Tausch an einem sonnigen Fußballplatz"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </section>

        <StickerManager
          userId={session.user.id}
          onChanged={() => setRefreshKey((current) => current + 1)}
        />

        <MatchFinder userId={session.user.id} refreshKey={refreshKey} />

        <BrowseOffers userId={session.user.id} refreshKey={refreshKey} />

        <ProfileSettings
          userId={session.user.id}
          onAccountDeleted={onLogout}
        />

        <SponsorCard />
      </main>
      <AppFooter />
    </div>
  );
}
