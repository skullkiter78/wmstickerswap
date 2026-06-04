"use client";

import { useEffect, useMemo, useState } from "react";
import { compareStickerCodes, findSticker, stickerLabel } from "@/lib/katalog";
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

type MatchContact = {
  kontakt_whatsapp: string | null;
  kontakt_email: string | null;
  kontakt_telefon: string | null;
};

type OfferGroup = {
  teamCode: string;
  teamName: string;
  offers: Offer[];
  stickerCount: number;
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
  const [hasNewOffers, setHasNewOffers] = useState(false);
  const [openTeamCodes, setOpenTeamCodes] = useState<string[]>([]);

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
  }, [userId]);

  useEffect(() => {
    if (refreshKey === 0 || isLoading) {
      return;
    }

    const timeoutId = window.setTimeout(() => setHasNewOffers(true), 0);

    return () => window.clearTimeout(timeoutId);
  }, [isLoading, refreshKey]);

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
    setHasNewOffers(false);
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

    return offers
      .filter((offer) => {
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
        const ortText =
          `${profile?.ort ?? ""} ${profile?.nickname ?? ""}`.toLowerCase();

        return (
          (!stickerSearch || stickerText.includes(stickerSearch)) &&
          (!ortSearch || ortText.includes(ortSearch))
        );
      })
      .sort((first, second) =>
        compareStickerCodes(first.sticker_code, second.sticker_code),
      );
  }, [offers, ortFilter, profileMap, stickerFilter]);

  const offerGroups = useMemo(
    () => groupOffersByTeam(filteredOffers),
    [filteredOffers],
  );

  function toggleTeam(teamCode: string) {
    setOpenTeamCodes((current) =>
      current.includes(teamCode)
        ? current.filter((code) => code !== teamCode)
        : [...current, teamCode],
    );
  }

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
          <p className="mt-2 text-sm leading-6 text-[#5d6b86]">
            Damit die Seite beim St&ouml;bern ruhig bleibt, laden neue Eintr&auml;ge
            nicht automatisch in die Liste. Du bekommst hier einen Hinweis und
            entscheidest selbst, wann aktualisiert wird.
          </p>
        </div>
        <button
          type="button"
          onClick={loadOffers}
          className={`h-12 rounded-lg px-4 text-sm font-black ${
            hasNewOffers
              ? "bg-[#fed447] text-[#172033]"
              : "border-2 border-[#132a74] text-[#132a74]"
          }`}
        >
          {hasNewOffers ? "Neue Angebote laden" : "Aktualisieren"}
        </button>
      </div>

      {hasNewOffers ? (
        <div className="mt-4 rounded-lg bg-[#fff8df] p-4 text-sm leading-6 text-[#6d5214] ring-1 ring-[#f1d982]">
          Neue Angebote oder Suchtreffer sind dazugekommen. Deine aktuelle
          Ansicht bleibt stabil; lade die Liste, wenn du bereit bist.
        </div>
      ) : null}

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
        <div className="mt-4 grid gap-3">
          {offerGroups.map((group) => (
            <OfferGroupSection
              key={group.teamCode}
              group={group}
              isOpen={openTeamCodes.includes(group.teamCode)}
              onToggle={() => toggleTeam(group.teamCode)}
              userId={userId}
              profileMap={profileMap}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function OfferGroupSection({
  group,
  isOpen,
  onToggle,
  userId,
  profileMap,
}: {
  group: OfferGroup;
  isOpen: boolean;
  onToggle: () => void;
  userId: string;
  profileMap: Map<string, PublicProfile>;
}) {
  return (
    <div className="rounded-lg bg-[#f7fbff] ring-1 ring-[#dbe7ff]">
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-lg px-4 py-3 text-left"
      >
        <span>
          <span className="block font-black text-[#132a74]">
            {group.teamName}
          </span>
          <span className="text-xs font-semibold text-[#5d6b86]">
            Code {group.teamCode}
          </span>
        </span>
        <span className="rounded-full bg-white px-3 py-2 text-sm font-black text-[#132a74]">
          {group.offers.length} Eintraege · {group.stickerCount} Karten
        </span>
      </button>

      {isOpen ? (
        <div className="grid gap-3 border-t border-[#dbe7ff] p-3 md:grid-cols-2">
          {group.offers.map((offer) => (
            <OfferCard
              key={offer.id}
              userId={userId}
              offer={offer}
              profile={profileMap.get(offer.user_id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function OfferCard({
  userId,
  offer,
  profile,
}: {
  userId: string;
  offer: Offer;
  profile: PublicProfile | undefined;
}) {
  const sticker = findSticker(offer.sticker_code);
  const label = sticker ? stickerLabel(sticker) : offer.sticker_code;
  const [contact, setContact] = useState<MatchContact | null>(null);
  const [contactMessage, setContactMessage] = useState(
    "Tippe auf Kontakt aufnehmen, wenn dich dieses Angebot interessiert.",
  );
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const proposalText = createOfferProposalText(profile, label);

  async function ensureSearchEntry() {
    const { data, error } = await supabase
      .from("user_stickers")
      .select("id")
      .eq("user_id", userId)
      .eq("liste", "suche")
      .eq("sticker_code", offer.sticker_code)
      .limit(1);

    if (error) {
      return error;
    }

    if (data && data.length > 0) {
      return null;
    }

    const { error: insertError } = await supabase.from("user_stickers").insert({
      user_id: userId,
      sticker_code: offer.sticker_code,
      anzahl: 1,
      liste: "suche",
      abgabe_art: null,
      preis_vorschlag: null,
    });

    return insertError;
  }

  async function loadContact() {
    setIsLoadingContact(true);
    setContactMessage("Kontakt wird vorbereitet...");

    const searchError = await ensureSearchEntry();

    if (searchError) {
      setContactMessage(searchError.message);
      setIsLoadingContact(false);
      return;
    }

    const { data, error } = await supabase.rpc("get_match_contact", {
      target_user_id: offer.user_id,
    });

    if (error) {
      setContactMessage(
        "Kontakt kann noch nicht angezeigt werden. Bitte pruefe die Supabase-Funktion get_match_contact.",
      );
      setIsLoadingContact(false);
      return;
    }

    const nextContact = (data?.[0] ?? null) as MatchContact | null;
    setContact(nextContact);
    setContactMessage(
      nextContact
        ? "Kontakt ist bereit. Der Sticker wurde in deine Suchliste uebernommen."
        : "Diese Person hat noch keine Kontaktwege hinterlegt.",
    );
    setIsLoadingContact(false);
  }

  return (
    <article className="rounded-lg bg-[#f7fbff] p-4 ring-1 ring-[#dbe7ff]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#e44533]">
            {formatAbgabeArt(offer.abgabe_art)}
          </p>
          <h3 className="mt-1 text-lg font-black">
            {label}
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

      <div className="mt-4 rounded-lg bg-white p-3">
        <p className="text-sm leading-6 text-[#5d6b86]">{contactMessage}</p>

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
                className="grid h-12 place-items-center rounded-lg bg-[#132a74] px-4 text-sm font-black text-white"
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
            className="mt-3 h-12 w-full rounded-lg bg-[#132a74] px-4 text-sm font-black text-white disabled:opacity-70"
          >
            {isLoadingContact ? "Kontakt wird geladen..." : "Kontakt aufnehmen"}
          </button>
        )}
      </div>
    </article>
  );
}

function cleanPhone(phone: string) {
  return phone.replace(/[^+\d]/g, "").replace(/^\+/, "");
}

function createOfferProposalText(
  profile: PublicProfile | undefined,
  stickerLabelText: string,
) {
  return `Hi ${profile?.nickname ?? "Sammler"}, ich habe dein Angebot in der Sticker-Tauschboerse gesehen.\n\nIch interessiere mich fuer: ${stickerLabelText}\n\nPasst das fuer dich?`;
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

function groupOffersByTeam(offers: Offer[]) {
  const groups = new Map<string, OfferGroup>();

  for (const offer of offers) {
    const sticker = findSticker(offer.sticker_code);
    const teamCode = sticker?.team_code ?? offer.sticker_code.slice(0, 3);
    const teamName = sticker?.team_name ?? teamCode;
    const group = groups.get(teamCode);

    if (group) {
      group.offers.push(offer);
      group.stickerCount += offer.anzahl;
    } else {
      groups.set(teamCode, {
        teamCode,
        teamName,
        offers: [offer],
        stickerCount: offer.anzahl,
      });
    }
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      offers: [...group.offers].sort((first, second) =>
        compareStickerCodes(first.sticker_code, second.sticker_code),
      ),
    }))
    .sort((first, second) =>
      first.teamName.localeCompare(second.teamName, "de", {
        sensitivity: "base",
      }),
    );
}
