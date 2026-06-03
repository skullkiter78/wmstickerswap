"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { findSticker, stickerLabel } from "@/lib/katalog";

type StickerListe = "habe" | "suche";
type AbgabeArt = "tausch" | "verschenken" | "verkauf";

type UserSticker = {
  id: string;
  user_id: string;
  sticker_code: string;
  anzahl: number;
  liste: StickerListe;
  abgabe_art: AbgabeArt | null;
  preis_vorschlag: number | null;
};

type PublicProfile = {
  id: string;
  nickname: string;
  ort: string;
};

type MatchContact = {
  kontakt_whatsapp: string | null;
  kontakt_email: string | null;
  kontakt_telefon: string | null;
};

type MatchFinderProps = {
  userId: string;
  refreshKey: number;
};

type Match = {
  userId: string;
  nickname: string;
  ort: string;
  givesMe: UserSticker[];
  wantsMine: UserSticker[];
};

export function MatchFinder({ userId, refreshKey }: MatchFinderProps) {
  const [stickers, setStickers] = useState<UserSticker[]>([]);
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [message, setMessage] = useState("Treffer werden geladen...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMatches();
  }, [userId, refreshKey]);

  async function loadMatches() {
    setIsLoading(true);

    const [
      { data: stickerData, error: stickerError },
      { data: profileData, error: profileError },
    ] = await Promise.all([
      supabase
        .from("user_stickers")
        .select(
          "id, user_id, sticker_code, anzahl, liste, abgabe_art, preis_vorschlag",
        ),
      supabase.rpc("get_public_profiles"),
    ]);

    if (stickerError) {
      setMessage(stickerError.message);
      setIsLoading(false);
      return;
    }

    if (profileError) {
      setMessage(
        "Treffer können noch nicht angezeigt werden. Bitte führe die SQL-Datei für öffentliche Profile in Supabase aus.",
      );
      setIsLoading(false);
      return;
    }

    setStickers((stickerData ?? []) as UserSticker[]);
    setProfiles((profileData ?? []) as PublicProfile[]);
    setMessage("Treffer sind aktuell.");
    setIsLoading(false);
  }

  const matches = useMemo(() => {
    const myEntries = stickers.filter((entry) => entry.user_id === userId);
    const myHave = new Set(
      myEntries
        .filter((entry) => entry.liste === "habe")
        .map((entry) => entry.sticker_code),
    );
    const mySearch = new Set(
      myEntries
        .filter((entry) => entry.liste === "suche")
        .map((entry) => entry.sticker_code),
    );
    const profileMap = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );
    const otherUserIds = Array.from(
      new Set(
        stickers
          .filter((entry) => entry.user_id !== userId)
          .map((entry) => entry.user_id),
      ),
    );

    return otherUserIds
      .map((otherUserId) => {
        const otherEntries = stickers.filter(
          (entry) => entry.user_id === otherUserId,
        );
        const givesMe = otherEntries.filter(
          (entry) => entry.liste === "habe" && mySearch.has(entry.sticker_code),
        );
        const wantsMine = otherEntries.filter(
          (entry) => entry.liste === "suche" && myHave.has(entry.sticker_code),
        );
        const profile = profileMap.get(otherUserId);

        return {
          userId: otherUserId,
          nickname: profile?.nickname ?? "Sammler",
          ort: profile?.ort ?? "Ort nicht angegeben",
          givesMe,
          wantsMine,
        };
      })
      .filter((match) => match.givesMe.length > 0 || match.wantsMine.length > 0)
      .sort((a, b) => {
        const aPerfect = a.givesMe.length > 0 && a.wantsMine.length > 0 ? 1 : 0;
        const bPerfect = b.givesMe.length > 0 && b.wantsMine.length > 0 ? 1 : 0;

        if (aPerfect !== bPerfect) {
          return bPerfect - aPerfect;
        }

        return (
          b.givesMe.length +
          b.wantsMine.length -
          (a.givesMe.length + a.wantsMine.length)
        );
      });
  }, [profiles, stickers, userId]);

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#e44533]">
            Automatischer Abgleich
          </p>
          <h2 className="mt-1 text-2xl font-black">Deine Treffer</h2>
          <p className="mt-2 text-sm leading-6 text-[#5d6b86]">
            Wir vergleichen deine Suchliste mit den Angeboten der anderen und
            umgekehrt.
          </p>
        </div>
        <button
          type="button"
          onClick={loadMatches}
          className="h-12 rounded-lg border-2 border-[#132a74] px-4 text-sm font-black text-[#132a74]"
        >
          Aktualisieren
        </button>
      </div>

      <p className="mt-3 text-sm leading-6 text-[#5d6b86]">{message}</p>

      {isLoading ? (
        <p className="mt-4 rounded-lg bg-[#f7fbff] p-4 text-sm font-bold text-[#132a74]">
          Lade Treffer...
        </p>
      ) : matches.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#f7fbff] p-4 text-sm leading-6 text-[#5d6b86]">
          Noch keine Treffer. Trag am besten erst ein paar Sticker in „Habe
          doppelt“ und „Suche noch“ ein.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {matches.map((match) => (
            <MatchCard key={matchKey(match)} match={match} />
          ))}
        </div>
      )}
    </section>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isPerfect = match.givesMe.length > 0 && match.wantsMine.length > 0;
  const [contact, setContact] = useState<MatchContact | null>(null);
  const [contactMessage, setContactMessage] = useState(
    "Wähle konkrete Sticker aus. Kontaktwege werden erst bei Treffer angezeigt.",
  );
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [selectedReceiveIds, setSelectedReceiveIds] = useState<string[]>(() =>
    match.givesMe.map((entry) => entry.id).slice(0, 5),
  );
  const [selectedOfferIds, setSelectedOfferIds] = useState<string[]>(() =>
    match.wantsMine.map((entry) => entry.id).slice(0, 5),
  );

  const selectedReceive = match.givesMe.filter((entry) =>
    selectedReceiveIds.includes(entry.id),
  );
  const selectedOffer = match.wantsMine.filter((entry) =>
    selectedOfferIds.includes(entry.id),
  );
  const proposalText = createProposalText(match, selectedReceive, selectedOffer);

  async function loadContact() {
    setIsLoadingContact(true);
    setContactMessage("Kontakt wird geladen...");

    const { data, error } = await supabase.rpc("get_match_contact", {
      target_user_id: match.userId,
    });

    if (error) {
      setContactMessage(
        "Kontakt kann noch nicht angezeigt werden. Bitte führe die SQL-Datei für Match-Kontakte in Supabase aus.",
      );
      setIsLoadingContact(false);
      return;
    }

    const nextContact = (data?.[0] ?? null) as MatchContact | null;
    setContact(nextContact);
    setContactMessage(
      nextContact
        ? "Kontakt ist bereit. Der E-Mail- und WhatsApp-Text nutzt deine Auswahl."
        : "Diese Person hat noch keine Kontaktwege hinterlegt.",
    );
    setIsLoadingContact(false);
  }

  return (
    <article
      className={`rounded-lg p-4 shadow-sm ring-1 ${
        isPerfect
          ? "bg-[#132a74] text-white ring-[#132a74]"
          : "bg-[#f7fbff] text-[#172033] ring-[#dbe7ff]"
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p
            className={
              isPerfect
                ? "text-sm font-bold text-[#fed447]"
                : "text-sm font-bold text-[#e44533]"
            }
          >
            {isPerfect ? "Perfekter Match" : "Treffer"}
          </p>
          <h3 className="mt-1 text-xl font-black">
            {match.nickname} aus {match.ort}
          </h3>
        </div>
        <p
          className={`rounded-full px-3 py-2 text-sm font-black ${
            isPerfect ? "bg-[#fed447] text-[#172033]" : "bg-white text-[#132a74]"
          }`}
        >
          Score {match.givesMe.length + match.wantsMine.length}
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <SelectableStickerList
          title={`Möchte ich bekommen (${match.givesMe.length})`}
          entries={match.givesMe}
          selectedIds={selectedReceiveIds}
          isPerfect={isPerfect}
          onToggle={(id) => setSelectedReceiveIds(toggleId(selectedReceiveIds, id))}
        />
        <SelectableStickerList
          title={`Biete ich an (${match.wantsMine.length})`}
          entries={match.wantsMine}
          selectedIds={selectedOfferIds}
          isPerfect={isPerfect}
          onToggle={(id) => setSelectedOfferIds(toggleId(selectedOfferIds, id))}
        />
      </div>

      <div
        className={`mt-4 rounded-lg p-3 ${
          isPerfect ? "bg-white/10" : "bg-white"
        }`}
      >
        <p
          className={
            isPerfect ? "text-sm text-white/80" : "text-sm text-[#5d6b86]"
          }
        >
          {contactMessage}
        </p>

        <div
          className={`mt-3 rounded-lg p-3 text-sm ${
            isPerfect ? "bg-white/10 text-white/85" : "bg-[#f7fbff] text-[#5d6b86]"
          }`}
        >
          <p className="font-black">Vorschau</p>
          <p className="mt-1 whitespace-pre-line">{proposalText}</p>
        </div>

        {contact ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {contact.kontakt_whatsapp ? (
              <a
                href={`https://wa.me/${cleanPhone(contact.kontakt_whatsapp)}?text=${encodeURIComponent(proposalText)}`}
                className="grid h-12 place-items-center rounded-lg bg-[#25d366] px-4 text-sm font-black text-[#102217]"
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
            {contact.kontakt_email ? (
              <a
                href={`mailto:${contact.kontakt_email}?subject=${encodeURIComponent("Sticker-Tausch")}&body=${encodeURIComponent(proposalText)}`}
                className="grid h-12 place-items-center rounded-lg bg-[#fed447] px-4 text-sm font-black text-[#172033]"
              >
                E-Mail
              </a>
            ) : null}
            {contact.kontakt_telefon ? (
              <a
                href={`tel:${contact.kontakt_telefon}`}
                className="grid h-12 place-items-center rounded-lg bg-white px-4 text-sm font-black text-[#132a74]"
              >
                Telefon
              </a>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={loadContact}
            disabled={isLoadingContact}
            className={`mt-3 h-12 rounded-lg px-4 text-sm font-black ${
              isPerfect
                ? "bg-[#fed447] text-[#172033]"
                : "bg-[#132a74] text-white"
            }`}
          >
            {isLoadingContact ? "Lade Kontakt..." : "Kontakt anzeigen"}
          </button>
        )}
      </div>
    </article>
  );
}

function SelectableStickerList({
  title,
  entries,
  selectedIds,
  isPerfect,
  onToggle,
}: {
  title: string;
  entries: UserSticker[];
  selectedIds: string[];
  isPerfect: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className={`rounded-lg p-3 ${isPerfect ? "bg-white/10" : "bg-white"}`}>
      <p className="text-sm font-black">{title}</p>
      {entries.length === 0 ? (
        <p
          className={
            isPerfect
              ? "mt-2 text-sm text-white/70"
              : "mt-2 text-sm text-[#5d6b86]"
          }
        >
          Kein direkter Gegenwert.
        </p>
      ) : (
        <div className="mt-2 grid gap-2">
          {entries.slice(0, 8).map((entry) => {
            const sticker = findSticker(entry.sticker_code);

            return (
              <label
                key={entry.id}
                className={`flex min-h-12 items-start gap-3 rounded-lg p-2 text-sm font-semibold ${
                  isPerfect ? "bg-white/10" : "bg-[#f7fbff]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(entry.id)}
                  onChange={() => onToggle(entry.id)}
                  className="mt-1 size-5 accent-[#fed447]"
                />
                <span>
                  {sticker ? stickerLabel(sticker) : entry.sticker_code}
                  <span className="block text-xs opacity-75">
                    {entry.anzahl}x
                  </span>
                </span>
              </label>
            );
          })}
          {entries.length > 8 ? (
            <p className="text-sm font-semibold">
              + {entries.length - 8} weitere
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function toggleId(ids: string[], id: string) {
  return ids.includes(id)
    ? ids.filter((existingId) => existingId !== id)
    : [...ids, id];
}

function matchKey(match: Match) {
  const receiveIds = match.givesMe.map((entry) => entry.id).join("-");
  const offerIds = match.wantsMine.map((entry) => entry.id).join("-");

  return `${match.userId}-${receiveIds}-${offerIds}`;
}

function cleanPhone(phone: string) {
  return phone.replace(/[^+\d]/g, "").replace(/^\+/, "");
}

function entryLabels(entries: UserSticker[]) {
  return entries
    .map((entry) => findSticker(entry.sticker_code))
    .filter(Boolean)
    .map((sticker) => stickerLabel(sticker!))
    .join(", ");
}

function createProposalText(
  match: Match,
  selectedReceive: UserSticker[],
  selectedOffer: UserSticker[],
) {
  return `Hi ${match.nickname}, ich habe dich in der Sticker-Tauschbörse gefunden.\n\nDu gibst mir: ${entryLabels(selectedReceive) || "passende Sticker"}\nIch gebe dir: ${entryLabels(selectedOffer) || "passende Sticker"}\n\nPasst das für dich?`;
}
