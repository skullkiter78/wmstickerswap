"use client";

import { useEffect, useMemo, useState } from "react";
import { findSticker, stickerLabel } from "@/lib/katalog";
import { supabase } from "@/lib/supabase";

type AbgabeArt = "tausch" | "verschenken" | "verkauf";

type Offer = {
  id: string;
  user_id: string;
  sticker_code: string;
  anzahl: number;
  abgabe_art: AbgabeArt | null;
  preis_vorschlag: number | null;
};

type PublicProfile = {
  id: string;
  nickname: string;
  ort: string;
};

type BrowseOffersProps = {
  userId: string;
  refreshKey: number;
};

export function BrowseOffers({ userId, refreshKey }: BrowseOffersProps) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [stickerFilter, setStickerFilter] = useState("");
  const [ortFilter, setOrtFilter] = useState("");
  const [message, setMessage] = useState("Angebote werden geladen...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadInitialOffers() {
      const [
        { data: offerData, error: offerError },
        { data: profileData, error: profileError },
      ] = await fetchOffers(userId);

      if (ignore) {
        return;
      }

      applyOfferResult(offerData, offerError, profileData, profileError);
    }

    loadInitialOffers();

    return () => {
      ignore = true;
    };
  }, [userId, refreshKey]);

  async function fetchOffers(currentUserId: string) {
    return Promise.all([
      supabase
        .from("user_stickers")
        .select("id, user_id, sticker_code, anzahl, abgabe_art, preis_vorschlag")
        .eq("liste", "habe")
        .neq("user_id", currentUserId)
        .order("created_at", { ascending: false }),
      supabase.rpc("get_public_profiles"),
    ]);
  }

  function applyOfferResult(
    offerData: unknown,
    offerError: { message: string } | null,
    profileData: unknown,
    profileError: { message: string } | null,
  ) {
    if (offerError) {
      setMessage(offerError.message);
      setIsLoading(false);
      return;
    }

    if (profileError) {
      setMessage(
        "Angebote können noch nicht angezeigt werden. Bitte prüfe die Supabase-Funktion get_public_profiles.",
      );
      setIsLoading(false);
      return;
    }

    setOffers((offerData ?? []) as Offer[]);
    setProfiles((profileData ?? []) as PublicProfile[]);
    setMessage("Angebote sind aktuell.");
    setIsLoading(false);
  }

  async function loadOffers() {
    setIsLoading(true);
    const [
      { data: offerData, error: offerError },
      { data: profileData, error: profileError },
    ] = await fetchOffers(userId);

    applyOfferResult(offerData, offerError, profileData, profileError);
  }

  const profileMap = useMemo(
    () => new Map(profiles.map((profile) => [profile.id, profile])),
    [profiles],
  );

  const filteredOffers = useMemo(() => {
    const stickerSearch = stickerFilter.trim().toLowerCase();
    const ortSearch = ortFilter.trim().toLowerCase();

    return offers.filter((offer) => {
      const sticker = findSticker(offer.sticker_code);
      const profile = profileMap.get(offer.user_id);
      const stickerText = [
        offer.sticker_code,
        sticker?.anzeige_code,
        sticker?.team_code,
        sticker?.team_name,
        sticker?.name,
        sticker?.typ,
        sticker ? stickerLabel(sticker) : "",
      ]
        .join(" ")
        .toLowerCase();
      const ortText = `${profile?.ort ?? ""} ${profile?.nickname ?? ""}`.toLowerCase();

      return (
        (!stickerSearch || stickerText.includes(stickerSearch)) &&
        (!ortSearch || ortText.includes(ortSearch))
      );
    });
  }, [offers, ortFilter, profileMap, stickerFilter]);

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#e44533]">Stöbern</p>
          <h2 className="mt-1 text-2xl font-black">Angebote der anderen</h2>
          <p className="mt-2 text-sm leading-6 text-[#5d6b86]">
            Schau nach, wer welche Sticker doppelt hat. Kontaktdaten bleiben
            weiterhin erst bei Treffern sichtbar.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOffers}
          className="h-12 rounded-lg border-2 border-[#132a74] px-4 text-sm font-black text-[#132a74]"
        >
          Aktualisieren
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-bold" htmlFor="browse-sticker">
          Sticker filtern
          <input
            id="browse-sticker"
            type="text"
            value={stickerFilter}
            onChange={(event) => setStickerFilter(event.target.value)}
            placeholder="z. B. MEX11, USA oder Team-Wappen"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base font-normal outline-none focus:border-[#132a74]"
          />
        </label>
        <label className="block text-sm font-bold" htmlFor="browse-ort">
          Ort / Vorort filtern
          <input
            id="browse-ort"
            type="text"
            value={ortFilter}
            onChange={(event) => setOrtFilter(event.target.value)}
            placeholder="z. B. Frömern, Dellwig, Fröndenberg"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base font-normal outline-none focus:border-[#132a74]"
          />
        </label>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#5d6b86]">
        {isLoading
          ? "Lade Angebote..."
          : `${filteredOffers.length} von ${offers.length} Angeboten sichtbar. ${message}`}
      </p>

      {isLoading ? (
        <p className="mt-4 rounded-lg bg-[#f7fbff] p-4 text-sm font-bold text-[#132a74]">
          Einen Moment...
        </p>
      ) : filteredOffers.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#f7fbff] p-4 text-sm leading-6 text-[#5d6b86]">
          Keine Angebote gefunden. Probiere einen anderen Sticker-Code oder
          lösche den Ortsfilter.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filteredOffers.slice(0, 60).map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              profile={profileMap.get(offer.user_id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OfferCard({
  offer,
  profile,
}: {
  offer: Offer;
  profile: PublicProfile | undefined;
}) {
  const sticker = findSticker(offer.sticker_code);

  return (
    <article className="rounded-lg bg-[#f7fbff] p-4 ring-1 ring-[#dbe7ff]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#e44533]">
            {formatAbgabeArt(offer.abgabe_art)}
          </p>
          <h3 className="mt-1 text-lg font-black">
            {sticker ? stickerLabel(sticker) : offer.sticker_code}
          </h3>
        </div>
        <p className="rounded-full bg-white px-3 py-2 text-sm font-black text-[#132a74]">
          {offer.anzahl}x
        </p>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#5d6b86]">
        Von {profile?.nickname ?? "Sammler"} aus{" "}
        {profile?.ort ?? "Ort nicht angegeben"}
      </p>

      {offer.abgabe_art === "verkauf" && offer.preis_vorschlag ? (
        <p className="mt-2 inline-flex rounded-full bg-[#fed447] px-3 py-2 text-sm font-black text-[#172033]">
          Preisvorschlag: {offer.preis_vorschlag.toFixed(2)} Euro
        </p>
      ) : null}
    </article>
  );
}

function formatAbgabeArt(abgabeArt: AbgabeArt | null) {
  if (abgabeArt === "verschenken") {
    return "Verschenken";
  }

  if (abgabeArt === "verkauf") {
    return "Verkaufen";
  }

  return "Tauschen";
}
