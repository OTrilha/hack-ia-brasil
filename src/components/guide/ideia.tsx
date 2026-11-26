import { FirstScreen, Rise } from "./rise";
import type { Block, Rich as RichT } from "@/guide/content";
import { Checklist } from "./checklist";
import { Flow } from "./flow";
import { GuideHero } from "./hero";
import { Pager } from "./pager";
import { Rich } from "./rich";
import { SectionIndex } from "./section-index";
import { Tabs } from "./tabs";
import { Bullets, GuideSection, H3, Intro, Lead, P } from "./ui";
import { PAGES, items, rich, section, splitLead, splitTitle, table } from "./data";

/** /guia/ideia: what we expect, the tracks, arriving with scope. */
export function GuideIdeia() {
  const index = PAGES.ideia.sections.map((id) => {
    const { num, text } = splitTitle(section(id).title);
    return { id, num, label: text };
  });

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 md:px-10 md:pb-24 lg:px-16">
      <GuideHero kicker="guia do participante" title={PAGES.ideia.label} />
      <div className="mt-16 grid gap-16 lg:mt-24 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-20">
        <SectionIndex items={index} label={PAGES.ideia.label} />
        <div className="grid min-w-0 gap-28 md:gap-40">
          <FirstScreen>
            <Esperamos />
          </FirstScreen>
          <Tracks />
          <Escopo />
          <Pager current="ideia" />
        </div>
      </div>
    </main>
  );
}

function Esperamos() {
  const b = section("esperamos").blocks;
  return (
    <GuideSection id="esperamos">
      <Rise y={12}>
        <Lead rich={rich(b[0])} className="mt-8" />
      </Rise>

      <Rise y={12}>
        <Intro rich={rich(b[1])} className="mt-14" />
      </Rise>
      <ol className="mt-6 border-t border-white/[0.08]">
        {items(b[2]).map((it, i) => {
          const { lead, body } = splitLead(it);
          return (
            <Rise as="li" key={i} delay={Math.min(i, 3) * 0.05} className="grid grid-cols-[2.25rem_1fr] gap-3 border-b border-white/[0.08] py-6 md:grid-cols-[3rem_1fr] md:py-7">
                <span aria-hidden className="pt-1.5 font-mono text-xs text-white/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-lg font-light leading-snug text-white md:text-xl">
                    <Rich rich={lead} strong="font-light" />
                  </p>
                  <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.7] text-white/70 md:text-base">
                    <Rich rich={body} />
                  </p>
                </div>
            </Rise>
          );
        })}
      </ol>

      {/* O que é um problema (e o que não é) */}
      <div className="mt-24 grid gap-6">
        <Rise y={12}>
          <H3 rich={rich(b[3])} />
        </Rise>
        <P rich={rich(b[4])} />
        <Rise y={10}>
          <p className="max-w-[62ch] rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 text-[15px] leading-[1.75] text-white/75 md:p-6 md:text-base">
            <Rich rich={rich(b[5])} strong="font-normal text-white" />
          </p>
        </Rise>
        <P rich={rich(b[6])} />
        <P rich={rich(b[7])} />
      </div>

      <div className="mt-14">
        <Intro rich={rich(b[8])} />
        <Flow items={items(b[9])} className="mt-6" />
      </div>

      <div className="mt-16">
        <Intro rich={rich(b[10])} />
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {items(b[11]).map((it, i) => {
            const { lead, body } = splitLead(it);
            return (
              <Rise key={i} y={12} delay={i * 0.06} className="h-full">
                <div className="h-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
                  <p className="text-lg font-light text-white">
                    <Rich rich={lead} strong="font-light" />
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.7] text-white/70 md:text-[15px]">
                    <Rich rich={body} />
                  </p>
                </div>
              </Rise>
            );
          })}
        </div>
      </div>

      {/* exemplos */}
      <div className="mt-24">
        <Rise y={8}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] text-white/80">
            <span aria-hidden className="size-1.5 rounded-full bg-white/70" />
            <Rich rich={rich(b[12])} />
          </p>
        </Rise>
        <Compare intro={rich(b[13])} t={b[14]} />
        <Compare intro={rich(b[15])} t={b[16]} />
      </div>
    </GuideSection>
  );
}

/** A two-column "genérico vs. real" table as before → after pairs. */
function Compare({ intro, t }: { intro: RichT; t: Block }) {
  const { head, rows } = table(t);
  return (
    <div className="mt-12">
      <Rise y={10}>
        <P rich={intro} />
      </Rise>
      <div className="mt-6 grid gap-1 border-b border-white/[0.08] pb-3 text-[13px] md:grid-cols-2 md:gap-6">
        <span className="flex items-center gap-2 text-white/45">
          <span aria-hidden className="size-1.5 rounded-full border border-white/40" />
          <Rich rich={head[0]} />
        </span>
        <span className="flex items-center gap-2 text-white">
          <span aria-hidden className="size-1.5 rounded-full bg-white" />
          <Rich rich={head[1]} />
        </span>
      </div>
      <ul>
        {rows.map(([from, to], i) => (
          <Rise as="li" key={i} y={10} delay={Math.min(i, 3) * 0.05} className="grid gap-2 border-b border-white/[0.08] py-5 md:grid-cols-2 md:gap-6">
              <p className="text-[14px] leading-[1.6] text-white/45 md:text-[15px]">
                <Rich rich={from} />
              </p>
              <p className="relative pl-5 text-[15px] leading-[1.65] text-white/90 md:pl-0 md:text-base">
                <span aria-hidden className="absolute left-0 top-0 font-mono text-xs leading-[1.9] text-white/40 md:hidden">
                  ↳
                </span>
                <Rich rich={to} />
              </p>
          </Rise>
        ))}
      </ul>
    </div>
  );
}

function Tracks() {
  const b = section("tracks").blocks;
  // three tracks, each: h3, description, "Direções…", list, "Para se inspirar…", cases
  const tracks = [1, 7, 13].map((h) => ({
    title: rich(b[h]),
    desc: rich(b[h + 1]),
    dirIntro: rich(b[h + 2]),
    dirs: items(b[h + 3]),
    caseIntro: rich(b[h + 4]),
    cases: items(b[h + 5]),
  }));

  return (
    <GuideSection id="tracks">
      <Rise y={12}>
        <Lead rich={rich(b[0])} className="mt-8" />
      </Rise>
      <div className="mt-12">
        <Tabs
          label="Tracks"
          tabs={tracks.map((t, i) => ({
            key: String(i),
            tab: <Rich rich={t.title} />,
            panel: (
              <div>
                <h3 className="sr-only">
                  <Rich rich={t.title} />
                </h3>
                <p className="max-w-[40ch] text-balance text-[1.35rem] font-extralight leading-snug text-white md:text-[1.75rem]">
                  <Rich rich={t.desc} />
                </p>
                <div className="mt-10">
                  <Intro rich={t.dirIntro} />
                  <Bullets items={t.dirs} className="mt-5 max-w-none md:grid-cols-2 md:gap-x-10" />
                </div>
                <div className="mt-12">
                  <Intro rich={t.caseIntro} />
                  {/* phone: a swipeable row (the next card peeks in); desktop: two columns */}
                  <ul className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-5 px-5 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0">
                    {t.cases.map((c, j) => (
                      <CaseCard key={j} rich={c} />
                    ))}
                  </ul>
                  <p aria-hidden className="mt-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/40 md:hidden">
                    {t.cases.length} cases · deslize →
                  </p>
                </div>
              </div>
            ),
          }))}
        />
      </div>
    </GuideSection>
  );
}

/** "**Pax**: texto… Leia na X" → name on top, text, source link at the foot. */
function CaseCard({ rich: r }: { rich: RichT }) {
  const { lead, body } = splitLead(r);
  const link = body.filter((s) => s.href);
  const text = body.filter((s) => !s.href);
  return (
    <li className="group relative flex w-[82%] shrink-0 snap-start flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors md:w-auto duration-300 hover:border-white/20 hover:bg-white/[0.035] md:p-6">
      <p className="text-lg font-light text-white">
        <Rich rich={lead} strong="font-light" />
      </p>
      <p className="mt-2 text-[14px] leading-[1.7] text-white/70 md:text-[15px]">
        <Rich rich={text} />
      </p>
      {link.length > 0 && (
        <p className="mt-auto pt-4 text-[13px] [&_a]:after:absolute [&_a]:after:inset-0 [&_a]:after:rounded-2xl">
          <Rich rich={link} />
        </p>
      )}
    </li>
  );
}

function Escopo() {
  const b = section("escopo").blocks;
  return (
    <GuideSection id="escopo">
      <Rise y={12}>
        <Lead rich={rich(b[0])} className="mt-8" />
      </Rise>
      <Rise y={12} className="mt-12">
        <Checklist id="escopo" items={items(b[1])} variant="numbered" />
      </Rise>
    </GuideSection>
  );
}
