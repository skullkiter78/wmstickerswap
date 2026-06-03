import Image from "next/image";
import { appConfig } from "@/lib/app-config";

export function VoucherBanner() {
  return (
    <section className="grid gap-4 rounded-lg bg-[#132a74] p-5 text-white shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
      <div>
        <p className="text-sm font-bold text-[#fed447]">
          Sticker-Sammler Vorteil
        </p>
        <h2 className="mt-2 text-2xl font-black">
          {appConfig.voucher.discountLabel} im dädd-Shop
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          Als Sammler bekommst du mit dem Code{" "}
          <span className="font-black text-[#fed447]">
            {appConfig.voucher.code}
          </span>{" "}
          Rabatt auf personalisierte 3D-Figuren aus Fröndenberg.
        </p>
        <a
          href={appConfig.sponsor.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-grid h-12 place-items-center rounded-lg bg-[#fed447] px-5 text-sm font-black text-[#172033]"
        >
          Zum dädd-Shop
        </a>
      </div>
      <Image
        src="/logos/daedd-logo.png"
        alt="dädd design"
        width={80}
        height={80}
        className="h-20 w-20 rounded-lg bg-black object-contain p-2 ring-1 ring-white/20"
      />
    </section>
  );
}

export function SponsorCard() {
  return (
    <section className="grid gap-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-[#dbe7ff] sm:grid-cols-[auto_1fr] sm:items-center">
      <Image
        src="/logos/daedd-logo.png"
        alt="dädd design"
        width={96}
        height={96}
        className="h-24 w-24 rounded-lg bg-black object-contain p-2"
      />
      <div>
        <p className="text-sm font-bold text-[#e44533]">Aus Fröndenberg</p>
        <h2 className="mt-2 text-xl font-black">
          Präsentiert von {appConfig.sponsor.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#5d6b86]">
          Kleine lokale Unterstützung für große Sammelfreude:{" "}
          {appConfig.sponsor.tagline}.
        </p>
        <a
          href={appConfig.sponsor.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-grid h-12 place-items-center rounded-lg border-2 border-[#132a74] px-5 text-sm font-black text-[#132a74]"
        >
          dädd design ansehen
        </a>
      </div>
    </section>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-[#dbe7ff] bg-white px-5 py-6 text-sm text-[#5d6b86]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <Image
          src="/logos/daedd-logo.png"
          alt="dädd design"
          width={56}
          height={56}
          className="h-14 w-14 rounded-lg bg-black object-contain p-1.5"
        />
        <p>
          <a
            className="font-bold text-[#132a74] underline-offset-4 hover:underline"
            href="/impressum"
          >
            Impressum
          </a>{" "}
          ·{" "}
          <a
            className="font-bold text-[#132a74] underline-offset-4 hover:underline"
            href="/datenschutz"
          >
            Datenschutz
          </a>{" "}
          · präsentiert von{" "}
          <a
            className="font-bold text-[#132a74] underline-offset-4 hover:underline"
            href={appConfig.sponsor.url}
            target="_blank"
            rel="noreferrer"
          >
            {appConfig.sponsor.name}
          </a>{" "}
          - {appConfig.sponsor.tagline}
        </p>
      </div>
    </footer>
  );
}
