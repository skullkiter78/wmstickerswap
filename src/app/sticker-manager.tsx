"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  compareStickerCodes,
  findSticker,
  katalog,
  type KatalogSticker,
  stickerLabel,
} from "@/lib/katalog";

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

export function StickerManager({ userId, onChanged }: StickerManagerProps) {
  const [liste, setListe] = useState<StickerListe>("habe");
  const [query, setQuery] = useState("");
  const [selectedSticker, setSelectedSticker] = useState<KatalogSticker | null>(
    null,
  );
  const [anzahl, setAnzahl] = useState(1);
  const [abgabeArt, setAbgabeArt] = useState<AbgabeArt>("tausch");
  const [preisVorschlag, setPreisVorschlag] = useState("");
  const [lastTeamCode, setLastTeamCode] = useState("");
  const [entries, setEntries] = useState<UserSticker[]>([]);
  const [message, setMessage] = useState(
    "Trag ein, was du suchst - wir sagen dir später automatisch per E-Mail Bescheid, sobald jemand eine deiner Karten anbietet.",
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const suggestions = useMemo(() => {
    const search = query.trim().toLowerCase();
    const effectiveSearch = search || lastTeamCode.toLowerCase();

    if (!effectiveSearch) {
      return katalog.slice(0, 8);
    }

    return katalog
      .filter((sticker) => {
        const haystack = [
          sticker.code,
          sticker.team_code,
          sticker.team_name,
          sticker.nummer.toString(),
          sticker.name,
          stickerLabel(sticker),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(effectiveSearch);
      })
      .slice(0, 8);
  }, [query, lastTeamCode]);

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
  }

  function selectSticker(sticker: KatalogSticker) {
    setSelectedSticker(sticker);
    setQuery(stickerLabel(sticker));
    setLastTeamCode(sticker.team_code);
  }

  async function addSticker() {
    if (!selectedSticker) {
      setMessage("Bitte wähle zuerst einen Sticker aus der Vorschlagsliste aus.");
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
    setQuery("");
    setSelectedSticker(null);
    setAnzahl(1);
    setPreisVorschlag("");
    setIsSaving(false);
    loadEntries();
    onChanged?.();
  }

  async function removeSticker(id: string) {
    const { error } = await supabase.from("user_stickers").delete().eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Eintrag gelöscht.");
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
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#e44533]">Stickerlisten</p>
          <h2 className="mt-1 text-2xl font-black">Sticker eintragen</h2>
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

      <p className="mt-3 text-sm leading-6 text-[#5d6b86]">{message}</p>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <label className="block text-sm font-bold" htmlFor="sticker-search">
            Sticker suchen
          </label>
          <input
            id="sticker-search"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedSticker(null);
            }}
            placeholder="z. B. MEX11, MEX oder Orbelin"
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-[#f7fbff] px-4 text-base outline-none focus:border-[#132a74]"
          />

          <div className="mt-2 grid gap-2">
            {suggestions.map((sticker) => (
              <button
                key={sticker.code}
                type="button"
                onClick={() => selectSticker(sticker)}
                className={`min-h-14 rounded-lg border px-4 py-3 text-left shadow-sm ${
                  selectedSticker?.code === sticker.code
                    ? "border-[#e44533] bg-[#fff3f1] ring-2 ring-[#f7c948]"
                    : "border-[#dbe7ff] bg-white"
                }`}
              >
                <span className="block text-sm font-black text-[#132a74]">
                  {stickerLabel(sticker)}
                </span>
                <span className="block text-xs font-semibold text-[#5d6b86]">
                  {sticker.team_name} · Code {sticker.code}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-[#f7fbff] p-4 ring-1 ring-[#dbe7ff]">
          <p className="text-sm font-black text-[#132a74]">
            {liste === "habe" ? "Doppelten Sticker anbieten" : "Sticker suchen"}
          </p>

          <label className="mt-4 block text-sm font-bold" htmlFor="anzahl">
            Anzahl
          </label>
          <input
            id="anzahl"
            type="number"
            min="1"
            value={anzahl}
            onChange={(event) => setAnzahl(Number(event.target.value))}
            className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-white px-4 text-base outline-none focus:border-[#132a74]"
          />

          {liste === "habe" ? (
            <>
              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="abgabe-art"
              >
                Abgabe-Art
              </label>
              <select
                id="abgabe-art"
                value={abgabeArt}
                onChange={(event) => setAbgabeArt(event.target.value as AbgabeArt)}
                className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-white px-4 text-base outline-none focus:border-[#132a74]"
              >
                <option value="tausch">Tauschen</option>
                <option value="verschenken">Verschenken</option>
                <option value="verkauf">Verkaufen</option>
              </select>

              {abgabeArt === "verkauf" ? (
                <>
                  <label
                    className="mt-4 block text-sm font-bold"
                    htmlFor="preis"
                  >
                    Preisvorschlag
                  </label>
                  <input
                    id="preis"
                    type="text"
                    inputMode="decimal"
                    value={preisVorschlag}
                    onChange={(event) => setPreisVorschlag(event.target.value)}
                    placeholder="z. B. 0,50"
                    className="mt-2 h-14 w-full rounded-lg border border-[#c9d8f5] bg-white px-4 text-base outline-none focus:border-[#132a74]"
                  />
                </>
              ) : null}
            </>
          ) : null}

          <button
            type="button"
            onClick={addSticker}
            disabled={isSaving}
            className="mt-5 h-14 w-full rounded-lg bg-[#e44533] px-5 text-base font-black text-white shadow-sm disabled:opacity-70"
          >
            {isSaving ? "Speichern..." : "Sticker speichern"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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
        <div className="mt-3 grid gap-2">
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
                  Löschen
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
