"use client";

import { useEffect, useMemo, useState } from "react";
import {
  compareStickerCodes,
  findSticker,
  katalog,
  type KatalogSticker,
  stickerLabel,
} from "@/lib/katalog";
import { supabase } from "@/lib/supabase";

type StickerListe = "habe" | "suche";
type AbgabeArt = "tausch" | "verschenken" | "verkauf";

type UserSticker = {
  id: string;
  sticker_code: string;
  anzahl: number;
  liste: StickerListe;
  abgabe_art: AbgabeArt | null;
  preis_vorschlag: number | null;
};

type StickerManagerProps = {
  userId: string;
  onChanged?: () => void;
};

type UserStickerListsProps = {
  userId: string;
  refreshKey: number;
  onChanged?: () => void;
};

const teamCodes = Array.from(
  new Set(katalog.map((sticker) => sticker.team_code)),
).sort((first, second) => {
  const firstSticker = katalog.find((sticker) => sticker.team_code === first);
  const secondSticker = katalog.find((sticker) => sticker.team_code === second);

  return (firstSticker?.team_name ?? first).localeCompare(
    secondSticker?.team_name ?? second,
    "de",
    { sensitivity: "base" },
  );
});

export function StickerManager({ userId, onChanged }: StickerManagerProps) {
  const [liste, setListe] = useState<StickerListe>("habe");
  const [teamQuery, setTeamQuery] = useState("");
  const [selectedSticker, setSelectedSticker] = useState<KatalogSticker | null>(
    null,
  );
  const [anzahl, setAnzahl] = useState(1);
  const [abgabeArt, setAbgabeArt] = useState<AbgabeArt>("tausch");
  const [preisVorschlag, setPreisVorschlag] = useState("");
  const [message, setMessage] = useState(
    "Kurz eintragen: Team-Code tippen, Nummer antippen, speichern.",
  );
  const [isSaving, setIsSaving] = useState(false);

  const normalizedTeamQuery = teamQuery.trim().toUpperCase();
  const matchingTeamCodes = useMemo(() => {
    if (!normalizedTeamQuery) {
      return [];
    }

    return teamCodes.filter((code) => code.startsWith(normalizedTeamQuery));
  }, [normalizedTeamQuery]);

  const selectedTeamCode = useMemo(() => {
    if (matchingTeamCodes.length === 1) {
      return matchingTeamCodes[0];
    }

    if (normalizedTeamQuery.length >= 3) {
      return (
        teamCodes.find((code) => code === normalizedTeamQuery) ??
        matchingTeamCodes[0] ??
        ""
      );
    }

    return "";
  }, [matchingTeamCodes, normalizedTeamQuery]);

  const selectedTeamStickers = useMemo(() => {
    if (!selectedTeamCode) {
      return [];
    }

    return katalog
      .filter((sticker) => sticker.team_code === selectedTeamCode)
      .sort((first, second) => first.nummer - second.nummer);
  }, [selectedTeamCode]);

  const selectedTeamName = selectedTeamStickers[0]?.team_name ?? "";

  function selectTeam(code: string) {
    setTeamQuery(code);
    setSelectedSticker(null);
  }

  function selectSticker(sticker: KatalogSticker) {
    setSelectedSticker(sticker);
    setTeamQuery(sticker.team_code);
  }

  async function addSticker() {
    if (!selectedSticker) {
      setMessage("Bitte waehle zuerst eine Nummer aus.");
      return;
    }

    setIsSaving(true);
    setMessage("Sticker wird gespeichert...");

    const payload = {
      user_id: userId,
      sticker_code: selectedSticker.code,
      anzahl,
      liste,
      abgabe_art: liste === "habe" ? abgabeArt : null,
      preis_vorschlag:
        liste === "habe" && abgabeArt === "verkauf" && preisVorschlag
          ? Number(preisVorschlag.replace(",", "."))
          : null,
    };

    const { error } = await supabase.from("user_stickers").insert(payload);

    if (error) {
      setMessage(error.message);
      setIsSaving(false);
      return;
    }

    setMessage(`${selectedSticker.code} wurde gespeichert.`);
    setSelectedSticker(null);
    setAnzahl(1);
    setPreisVorschlag("");
    setIsSaving(false);
    onChanged?.();
  }

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#e44533]">Stickerlisten</p>
          <h2 className="mt-1 text-2xl font-black">Sticker eintragen</h2>
          <p className="mt-2 text-sm leading-6 text-[#5d6b86]">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#eef5ff] p-1">
          <button
            type="button"
            onClick={() => setListe("habe")}
            className={`h-12 rounded-md px-4 text-sm font-black ${
              liste === "habe"
                ? "bg-white text-[#132a74] shadow-sm"
                : "text-[#5d6b86]"
            }`}
          >
            Habe doppelt
          </button>
          <button
            type="button"
            onClick={() => setListe("suche")}
            className={`h-12 rounded-md px-4 text-sm font-black ${
              liste === "suche"
                ? "bg-white text-[#132a74] shadow-sm"
                : "text-[#5d6b86]"
            }`}
          >
            Suche noch
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr_auto] lg:items-end">
        <label className="block text-sm font-bold" htmlFor="team-code">
          Mannschaft
          <input
            id="team-code"
            type="text"
            value={teamQuery}
            onChange={(event) => {
              setTeamQuery(event.target.value.toUpperCase());
              setSelectedSticker(null);
            }}
            placeholder="z. B. MEX"
            maxLength={3}
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base uppercase outline-none focus:border-[#132a74]"
          />
        </label>

        <div>
          <p className="text-sm font-bold">
            {selectedTeamCode
              ? `${selectedTeamName} (${selectedTeamCode})`
              : "Nummer"}
          </p>
          {selectedTeamStickers.length > 0 ? (
            <div className="mt-2 grid max-h-40 grid-cols-5 gap-2 overflow-y-auto pr-1 sm:grid-cols-8 lg:max-h-28">
              {selectedTeamStickers.map((sticker) => (
                <button
                  key={sticker.code}
                  type="button"
                  onClick={() => selectSticker(sticker)}
                  className={`h-11 rounded-lg border text-sm font-black ${
                    selectedSticker?.code === sticker.code
                      ? "border-[#e44533] bg-[#fff3f1] text-[#132a74] ring-2 ring-[#f7c948]"
                      : "border-[#dbe7ff] bg-[#f7fbff] text-[#132a74]"
                  }`}
                  title={stickerLabel(sticker)}
                >
                  {sticker.nummer}
                </button>
              ))}
            </div>
          ) : normalizedTeamQuery ? (
            <div className="mt-2 rounded-lg bg-[#f7fbff] p-3 text-sm leading-6 text-[#5d6b86]">
              {matchingTeamCodes.length > 0 ? (
                <>
                  <span>Noch nicht eindeutig:</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {matchingTeamCodes.slice(0, 8).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => selectTeam(code)}
                        className="h-9 rounded-lg bg-white px-3 text-xs font-black text-[#132a74] ring-1 ring-[#dbe7ff]"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                "Kein Team gefunden. Bitte den dreistelligen Team-Code eingeben."
              )}
            </div>
          ) : (
            <p className="mt-2 rounded-lg bg-[#f7fbff] p-3 text-sm leading-6 text-[#5d6b86]">
              Gib den Team-Code ein. Sobald die Mannschaft eindeutig ist,
              erscheinen die Nummern.
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-[7rem_1fr] lg:block">
          <label className="block text-sm font-bold" htmlFor="anzahl">
            Anzahl
            <input
              id="anzahl"
              type="number"
              min="1"
              value={anzahl}
              onChange={(event) => setAnzahl(Number(event.target.value))}
              className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
            />
          </label>
          <button
            type="button"
            onClick={addSticker}
            disabled={isSaving}
            className="h-14 rounded-lg bg-[#e44533] px-5 text-base font-black text-white shadow-sm disabled:opacity-70 sm:self-end lg:mt-7 lg:w-full"
          >
            {isSaving ? "Speichern..." : "Speichern"}
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
        {selectedSticker ? (
          <div className="rounded-lg bg-[#fff8df] p-3 text-sm leading-6 text-[#6d5214] ring-1 ring-[#f1d982]">
            Ausgewaehlt:{" "}
            <span className="font-black">{stickerLabel(selectedSticker)}</span>
          </div>
        ) : null}

        {liste === "habe" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm font-bold" htmlFor="abgabe-art">
              Abgabe-Art
              <select
                id="abgabe-art"
                value={abgabeArt}
                onChange={(event) => setAbgabeArt(event.target.value as AbgabeArt)}
                className="mt-2 h-12 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
              >
                <option value="tausch">Tauschen</option>
                <option value="verschenken">Verschenken</option>
                <option value="verkauf">Verkaufen</option>
              </select>
            </label>

            {abgabeArt === "verkauf" ? (
              <label className="block text-sm font-bold" htmlFor="preis">
                Preisvorschlag
                <input
                  id="preis"
                  type="text"
                  inputMode="decimal"
                  value={preisVorschlag}
                  onChange={(event) => setPreisVorschlag(event.target.value)}
                  placeholder="z. B. 0,50"
                  className="mt-2 h-12 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
                />
              </label>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function UserStickerLists({
  userId,
  refreshKey,
  onChanged,
}: UserStickerListsProps) {
  const [entries, setEntries] = useState<UserSticker[]>([]);
  const [message, setMessage] = useState("Stickerlisten werden geladen...");

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, refreshKey]);

  async function loadEntries() {
    const { data, error } = await supabase
      .from("user_stickers")
      .select("id, sticker_code, anzahl, liste, abgabe_art, preis_vorschlag")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setEntries((data ?? []) as UserSticker[]);
    setMessage("Deine Listen sind aktuell.");
  }

  async function removeSticker(id: string) {
    const { error } = await supabase.from("user_stickers").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Eintrag geloescht.");
    loadEntries();
    onChanged?.();
  }

  const habeEntries = sortStickerEntries(
    entries.filter((entry) => entry.liste === "habe"),
  );
  const sucheEntries = sortStickerEntries(
    entries.filter((entry) => entry.liste === "suche"),
  );

  return (
    <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
      <div>
        <p className="text-sm font-bold text-[#e44533]">Deine Eintragungen</p>
        <h2 className="mt-1 text-2xl font-black">Doppelt & gesucht</h2>
        <p className="mt-2 text-sm leading-6 text-[#5d6b86]">{message}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <StickerList
          title="Habe doppelt"
          emptyText="Noch keine doppelten Sticker eingetragen."
          entries={habeEntries}
          onRemove={removeSticker}
        />
        <StickerList
          title="Suche noch"
          emptyText="Noch keine gesuchten Sticker eingetragen."
          entries={sucheEntries}
          onRemove={removeSticker}
        />
      </div>
    </section>
  );
}

function StickerList({
  title,
  emptyText,
  entries,
  onRemove,
}: {
  title: string;
  emptyText: string;
  entries: UserSticker[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="rounded-lg border border-[#dbe7ff] p-4">
      <h3 className="font-black text-[#132a74]">{title}</h3>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm leading-6 text-[#5d6b86]">{emptyText}</p>
      ) : (
        <div className="mt-3 grid max-h-96 gap-2 overflow-y-auto pr-1">
          {entries.map((entry) => {
            const sticker = findSticker(entry.sticker_code);

            return (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-[#f7fbff] p-3"
              >
                <div>
                  <p className="font-black">
                    {sticker ? stickerLabel(sticker) : entry.sticker_code}
                  </p>
                  <p className="text-xs font-semibold text-[#5d6b86]">
                    {entry.anzahl}x
                    {entry.abgabe_art ? ` · ${formatAbgabeArt(entry.abgabe_art)}` : ""}
                    {entry.preis_vorschlag
                      ? ` · ${entry.preis_vorschlag.toFixed(2)} Euro`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(entry.id)}
                  className="h-10 rounded-lg border border-[#c9d8f5] px-3 text-sm font-black text-[#132a74]"
                >
                  Loeschen
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatAbgabeArt(abgabeArt: AbgabeArt) {
  if (abgabeArt === "tausch") {
    return "Tauschen";
  }

  if (abgabeArt === "verschenken") {
    return "Verschenken";
  }

  return "Verkaufen";
}

function sortStickerEntries(entries: UserSticker[]) {
  return [...entries].sort((first, second) =>
    compareStickerCodes(first.sticker_code, second.sticker_code),
  );
}
