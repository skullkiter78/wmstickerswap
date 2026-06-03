import Link from "next/link";
import { AppFooter } from "../sponsor";

export default function ImpressumPage() {
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
          <p className="text-sm font-bold text-[#e44533]">Anbieterkennzeichnung</p>
          <h1 className="mt-2 font-display text-5xl leading-none tracking-normal text-[#132a74]">
            Impressum
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#5d6b86]">
            Angaben nach § 5 DDG
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <InfoCard title="Anbieter">
            <p>Benjamin Aufdemkamp</p>
            <p>dädd design Atelier</p>
            <p>Märkischer Ring 120, 58097 Hagen</p>
          </InfoCard>

          <InfoCard title="Kontakt">
            <p>
              Telefon:{" "}
              <a className="font-bold text-[#132a74]" href="tel:+491638705633">
                +49 163 8705633
              </a>
            </p>
            <p>
              E-Mail:{" "}
              <a
                className="font-bold text-[#132a74]"
                href="mailto:info@daedd-design.de"
              >
                info@daedd-design.de
              </a>
            </p>
          </InfoCard>

          <InfoCard title="Gewerbe">
            <p>
              Gewerbeanmeldung beim Gewerbeamt der Stadt Fröndenberg/Ruhr.
            </p>
          </InfoCard>

          <InfoCard title="Umsatzsteuer">
            <p>
              Gemäß § 19 UStG wird keine Umsatzsteuer berechnet
              (Kleinunternehmerregelung).
            </p>
          </InfoCard>

          <InfoCard title="Verantwortlich für den Inhalt">
            <p>Benjamin Aufdemkamp</p>
            <p>Märkischer Ring 120, 58097 Hagen</p>
          </InfoCard>

          <InfoCard title="Hinweis">
            <p>
              Diese Sticker-Tauschbörse ist ein lokales, nicht-kommerzielles
              Projekt im Bekanntenkreis. Sie nutzt keine offiziellen FIFA- oder
              Panini-Logos und ist kein Angebot von FIFA oder Panini.
            </p>
          </InfoCard>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-lg bg-white p-5 text-sm leading-6 shadow-sm ring-1 ring-[#dbe7ff]">
      <h2 className="mb-2 text-xl font-black text-[#172033]">{title}</h2>
      <div className="text-[#5d6b86]">{children}</div>
    </article>
  );
}
