import Link from "next/link";
import { EVENT, localePath, type Lang } from "@/content";

const T = {
  pt: {
    back: "← Hack IA Brasil",
    switchLabel: "EN",
    label: "inscrições",
    h1: "Inscrições encerradas.",
    intro:
      "As inscrições terminaram na quinta, 26/11, às 23h59. Obrigado a todo mundo que se inscreveu!",
    line: "28.11 · 8h–18h · Medway João Pessoa",
    guide: "Guia do participante",
    home: "Voltar ao início",
  },
  en: {
    back: "← Hack IA Brasil",
    switchLabel: "PT",
    label: "applications",
    h1: "Applications are closed.",
    intro:
      "Applications closed on Thursday, Nov 26, at 11:59pm (Brasília time). Thanks to everyone who applied!",
    line: "11.28 · 8am–6pm · Medway João Pessoa",
    guide: "Participant guide",
    home: "Back to home",
  },
};

export function SignupPage({ lang }: { lang: Lang }) {
  const t = T[lang];
  return (
    <main className="flex min-h-dvh flex-col bg-black font-light text-white selection:bg-white selection:text-[#000928]">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-7 md:px-8">
        <Link
          href={localePath(lang, "/")}
          className="font-mono text-xs uppercase tracking-[0.28em] text-white/90 transition-colors hover:text-white"
        >
          {t.back}
        </Link>
        <Link
          href={localePath(lang === "en" ? "pt" : "en", "/inscricao")}
          hrefLang={lang === "en" ? "pt-BR" : "en"}
          className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/60 transition-colors hover:text-white"
        >
          {t.switchLabel}
        </Link>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 pb-24 pt-10 md:px-8 md:pt-16">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/75">{t.label}</p>
        <h1 className="mt-6 text-3xl font-extralight leading-tight md:text-5xl">{t.h1}</h1>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80">{t.intro}</p>
        <p className="mt-10 font-mono text-xs uppercase leading-relaxed tracking-[0.3em] text-white/60">{t.line}</p>
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-xs uppercase tracking-[0.3em]">
          <Link
            href={EVENT.guideUrl}
            className="inline-flex items-center bg-white px-7 py-3.5 font-semibold text-[#000928] transition-[filter] duration-300 hover:brightness-110"
          >
            {t.guide}
          </Link>
          <Link href={localePath(lang, "/")} className="text-white/75 transition-colors hover:text-white">
            {t.home}
          </Link>
        </div>
      </div>
    </main>
  );
}
