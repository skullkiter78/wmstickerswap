"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type OnboardingProps = {
  userId: string;
  show: boolean;
  onDone: () => void;
};

const steps = [
  {
    title: "1. Doppelte Sticker eintragen",
    text: "Alles, was du mehrfach hast, kommt in „Habe doppelt“.",
  },
  {
    title: "2. Fehlende Sticker suchen",
    text: "In „Suche noch“ sammelst du die Karten, die dir fehlen.",
  },
  {
    title: "3. Treffer finden",
    text: "Wenn es passt, bekommst du einen Match und kannst Kontakt aufnehmen.",
  },
];

export function Onboarding({ userId, show, onDone }: OnboardingProps) {
  const [isSaving, setIsSaving] = useState(false);

  if (!show) {
    return null;
  }

  async function finish() {
    setIsSaving(true);
    await supabase
      .from("profiles")
      .update({ onboarding_abgeschlossen: true })
      .eq("id", userId);
    setIsSaving(false);
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#172033]/70 p-5">
      <section className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
        <p className="text-sm font-bold text-[#e44533]">Willkommen</p>
        <h2 className="mt-2 font-display text-5xl leading-none tracking-normal text-[#132a74]">
          So läuft der Tausch
        </h2>
        <div className="mt-5 grid gap-3">
          {steps.map((step) => (
            <article key={step.title} className="rounded-lg bg-[#f7fbff] p-4">
              <h3 className="font-black">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-[#5d6b86]">
                {step.text}
              </p>
            </article>
          ))}
        </div>
        <button
          type="button"
          onClick={finish}
          disabled={isSaving}
          className="mt-5 h-14 w-full rounded-lg bg-[#e44533] px-5 text-base font-black text-white disabled:opacity-70"
        >
          {isSaving ? "Speichern..." : "Los geht's"}
        </button>
      </section>
    </div>
  );
}
