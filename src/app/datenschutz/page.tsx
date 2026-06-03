import Link from "next/link";
import { AppFooter } from "../sponsor";

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#f7fbff] text-[#172033]">
      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="font-display text-3xl leading-none tracking-normal text-[#132a74]"
        >
          Sticker Swap
        </Link>
        <Link
          href="/"
          className="rounded-full bg-[#fed447] px-5 py-3 text-sm font-black text-[#172033]"
        >
          Zurück
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-4xl gap-5 px-5 pb-12">
        <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
          <p className="text-sm font-bold text-[#e44533]">Kurz & verständlich</p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-normal text-[#132a74]">
            Datenschutz-Hinweis
          </h1>
          <p className="mt-4 text-base leading-7 text-[#33415c]">
            Diese App ist eine private, nicht-kommerzielle Tauschbörse für
            WM-Sticker im Umkreis Fröndenberg. Wir sammeln nur die Daten, die
            fürs Tauschen nötig sind.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard
            title="Welche Daten?"
            text="Nickname, Wohnort ohne Straße, optionale Kontaktwege und deine Stickerlisten."
          />
          <InfoCard
            title="Wofür?"
            text="Nur damit du passende Tauschpartner findest und Treffer sehen kannst."
          />
          <InfoCard
            title="Was nicht?"
            text="Keine Weitergabe an Werbepartner, kein Verkauf deiner Daten, keine Straßenadresse."
          />
          <InfoCard
            title="Kontaktdaten"
            text="WhatsApp, E-Mail und Telefon werden anderen erst bei einem Treffer angezeigt."
          />
          <InfoCard
            title="Speicherung"
            text="Die Daten liegen bei Supabase. Die App ist für ein späteres Hosting auf Vercel vorbereitet."
          />
          <InfoCard
            title="Löschen"
            text="Du kannst deine Sticker und dein Profil löschen. Das vollständige Auth-Konto löschen wir über eine sichere Serverfunktion."
          />
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff]">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#5d6b86]">{text}</p>
    </article>
  );
}
