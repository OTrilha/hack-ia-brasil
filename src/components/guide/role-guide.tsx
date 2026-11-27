import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EVENT, STAFF_SCHEDULE } from "@/content";
import { GuideHero } from "./hero";
import { GuideShell } from "./shell";

export function roleGuideMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { title, description, siteName: EVENT.name, locale: "pt_BR", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

type RoleGuideProps = {
  role: "mentor" | "jurados";
  title: string;
  lead: string;
  feature: ReactNode;
  children: ReactNode;
};

export function RoleGuide({ role, title, lead, feature, children }: RoleGuideProps) {
  return (
    <GuideShell staff>
      <main className="mx-auto max-w-6xl px-5 pb-16 md:px-10 md:pb-24 lg:px-16">
        <div className="grid gap-8 pb-10 md:pb-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
          <GuideHero
            kicker={role === "mentor" ? "Guia do mentor" : "Guia dos jurados"}
            meta={EVENT.dateLabel + " · João Pessoa"}
            title={title}
            after={
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <a href="#etapas" className="group inline-flex items-center gap-3 rounded-sm font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4">
                  <span aria-hidden className="grid size-8 place-items-center rounded-full border border-white/25 motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5">↓</span>
                  {role === "mentor" ? "Como mentorar" : "Etapas da avaliação"}
                </a>
                <a href="#cronograma-do-dia" className="rounded-sm text-sm text-white/75 underline decoration-white/30 underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4">
                  Cronograma do dia
                </a>
              </div>
            }
            lead={<p className="max-w-[37ch] text-pretty text-[17px] leading-relaxed text-white/75 md:text-lg">{lead}</p>}
          />
          <div className="min-w-0 lg:pt-20">{feature}</div>
        </div>
        <div id="etapas" className="scroll-mt-16">{children}</div>
        <section id="cronograma-do-dia" aria-labelledby="titulo-cronograma-do-dia" className="scroll-mt-16 border-t border-white/15 py-10 md:py-14">
          <h2 id="titulo-cronograma-do-dia" className="font-mono text-xs uppercase tracking-[0.25em] text-white/70">Cronograma do dia</h2>
          <p className="mt-4 text-4xl font-extralight tracking-tight md:text-5xl">
            {STAFF_SCHEDULE[0].t} – {STAFF_SCHEDULE[STAFF_SCHEDULE.length - 1].t}
          </p>
          <ol className="mt-7 border-l border-white/20 md:mt-10">
            {STAFF_SCHEDULE.map(({ t, what, where }) => (
              <li key={t} className="-ml-px grid grid-cols-[4rem_1fr] items-baseline gap-x-3 border-l border-transparent py-2.5 pl-4 first:border-white hover:border-white md:grid-cols-[5rem_1fr_auto] md:gap-x-5 md:py-3 md:pl-6">
                <time dateTime={t} className="row-span-2 font-mono text-sm tabular-nums text-white/75 md:row-span-1">{t}</time>
                <span className="text-base md:text-lg">{what}</span>
                <span className="col-start-2 font-mono text-[11px] uppercase tracking-[0.15em] text-white/60 md:col-start-3">{where}</span>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </GuideShell>
  );
}

export function GuideBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-white/15 py-8 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-12 md:py-10">
      <h2 className="text-balance text-[1.55rem] font-light leading-tight tracking-tight md:text-[1.85rem]">{title}</h2>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function StepList({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-5">
      {steps.map((step, i) => (
        <li key={step.title} className="grid grid-cols-[2rem_1fr] items-baseline gap-2">
          <span aria-hidden className="font-mono text-xs tabular-nums text-white/55">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h3 className="text-lg font-medium leading-snug">{step.title}</h3>
            <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-white/70">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Roster({ names }: { names: string[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[15px] text-white/80 sm:grid-cols-3">
      {names.map((name) => <li key={name}>{name}</li>)}
    </ul>
  );
}
