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
          {appConfig.voucher.discountLabel} im d&auml;dd-design Atelier
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/85">
          Personalisierte Geschenkideen in 3D: exklusive 3D-Karikaturen,
          Figurenkunst und besondere Erinnerungsst&uuml;cke aus
          Fr&ouml;ndenberg. Mit dem Code{" "}
          <span className="font-black text-[#fed447]">
            {appConfig.voucher.code}
          </span>{" "}
          bekommst du als Sticker-Sammler Rabatt.
        </p>
        <a
          href={appConfig.sponsor.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-grid h-12 place-items-center rounded-lg bg-[#fed447] px-5 text-sm font-black text-[#172033]"
        >
          Zum d&auml;dd-design Shop
        </a>
      </div>
      <Image
        src="/logos/daedd-logo.png"
        alt="daedd design"
        width={80}
        height={80}
        className="h-20 w-20 rounded-lg bg-black object-contain p-2 ring-1 ring-white/20"
      />
    </section>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-[#dbe7ff] bg-white px-5 py-6 text-sm text-[#5d6b86]">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <Image
          src="/logos/daedd-atelier-wordmark.png"
          alt="daedd design Atelier"
          width={220}
          height={55}
          className="h-auto w-44 object-contain sm:w-56"
        />
        <p>
          <a
            className="font-bold text-[#132a74] underline-offset-4 hover:underline"
            href="/impressum"
          >
            Impressum
          </a>{" "}
          &middot;{" "}
          <a
            className="font-bold text-[#132a74] underline-offset-4 hover:underline"
            href="/datenschutz"
          >
            Datenschutz
          </a>{" "}
          &middot; pr&auml;sentiert von{" "}
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
