import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EVENT } from "@/content";
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
              <a href="#etapas" className="group inline-flex items-center gap-3 rounded-sm font-mono text-[11px] uppercase tracking-[0.18em] text-white/80 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4">
                <span aria-hidden className="grid size-8 place-items-center rounded-full border border-white/25 motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5">↓</span>
                {role === "mentor" ? "Como mentorar" : "Etapas da avaliação"}
              </a>
            }
            lead={<p className="max-w-[37ch] text-pretty text-[17px] leading-relaxed text-white/75 md:text-lg">{lead}</p>}
          />
          <div className="min-w-0 lg:pt-20">{feature}</div>
        </div>
        <div id="etapas" className="scroll-mt-16">{children}</div>
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
