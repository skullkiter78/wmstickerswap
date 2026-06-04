import katalogData from "../../data/katalog.json";

export type KatalogSticker = {
  code: string;
  anzeige_code?: string;
  team_code: string;
  team_name: string;
  nummer: number;
  typ?: string;
  name: string;
};

type KatalogDatei =
  | KatalogSticker[]
  | {
      sticker: KatalogSticker[];
    };

const katalogRaw = katalogData as KatalogDatei;

export const katalog = Array.isArray(katalogRaw)
  ? katalogRaw
  : katalogRaw.sticker;

export function stickerLabel(sticker: KatalogSticker) {
  const code = sticker.anzeige_code ?? `${sticker.team_code} ${sticker.nummer}`;
  const name = sticker.name || sticker.typ || sticker.team_name;

  return `${code} - ${name}`;
}

export function findSticker(code: string) {
  return katalog.find((sticker) => sticker.code === code);
}

export function compareStickerCodes(firstCode: string, secondCode: string) {
  const firstSticker = findSticker(firstCode);
  const secondSticker = findSticker(secondCode);

  const firstTeam = firstSticker?.team_name ?? "";
  const secondTeam = secondSticker?.team_name ?? "";
  const teamCompare = firstTeam.localeCompare(secondTeam, "de", {
    sensitivity: "base",
  });

  if (teamCompare !== 0) {
    return teamCompare;
  }

  const firstNumber = firstSticker?.nummer ?? Number.MAX_SAFE_INTEGER;
  const secondNumber = secondSticker?.nummer ?? Number.MAX_SAFE_INTEGER;

  if (firstNumber !== secondNumber) {
    return firstNumber - secondNumber;
  }

  return firstCode.localeCompare(secondCode, "de", { sensitivity: "base" });
}
