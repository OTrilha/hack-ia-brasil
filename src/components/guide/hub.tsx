import Link from "next/link";
import { Rise } from "./rise";
import { Checklist } from "./checklist";
import { GuideHero } from "./hero";
import { Rich } from "./rich";
import { GuideSection, Kicker, Lead, Note } from "./ui";
import { PAGES, clean, items, plain, rich, section, splitLead, splitTitle, table, type PageKey } from "./data";

/** Download for the guardian's authorization template, shown under the minors checklist item. */
function MinorsTemplate() {
  return (
    <a
      href="/guia/autorizacao-menores.docx"
      download="Autorização-para-menores.docx"
      className="group/dl inline-flex items-center gap-2.5 rounded-full border border-white/15 py-1.5 pl-2 pr-3.5 font-mono text-[11px] uppercase tracking-[0.2em] text-white/75 transition-[border-color,color,transform] duration-200 ease-out hover:border-white/50 hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5 transition-transform duration-200 ease-out group-hover/dl:translate-y-px" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2.5v8M4.5 7.5 8 11l3.5-3.5M3 13.5h10" />
      </svg>
      baixar modelo
      <span className="text-white/40">.docx</span>
    </a>
  );
}

/** /guia: intro, checklist, the event in short, then the two doors. */
export function GuideHub() {
  const intro = section("intro").blocks;
  const checklist = section("checklist").blocks;
  const evento = section("evento").blocks;
  const facts = table(evento[0]);
  const factRows = [facts.head, ...facts.rows];
  const todo = items(checklist[0]);
  const minorsAt = todo.findIndex((it) => plain(it).startsWith("Menores de 18 anos"));

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 md:px-10 md:pb-24 lg:px-16">
      {/* Phone: intro → checklist → evento, in the guide's order.
          Desktop: the event summary sits beside the hero and the checklist,
          so the first screen answers "when and where" instead of half empty. */}
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-16">
        <section id="intro" data-guide-section aria-label="Introdução" className="lg:col-start-1 lg:row-start-1">
          <GuideHero
            kicker="guia do participante"
            meta={<Rich rich={rich(intro[0])} />}
            title={plain(rich(intro[1]))}
            lead={<Lead rich={rich(intro[2])} />}
            after={
              <a
                href="#checklist"
                className="group inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
              >
                <span className="grid size-8 place-items-center rounded-full border border-white/15 transition-[border-color,transform] duration-200 ease-out group-hover:translate-y-0.5 group-hover:border-white/50 group-active:scale-[0.94]">
                  ↓
                </span>
                comece por aqui
              </a>
            }
          />
        </section>

        <GuideSection id="checklist" className="mt-16 md:mt-28 lg:col-start-1 lg:row-start-2">
          <Rise y={12} className="mt-8">
            <Checklist id="antes" items={todo} extras={minorsAt >= 0 ? { [minorsAt]: <MinorsTemplate /> } : undefined} />
          </Rise>
        </GuideSection>

        <GuideSection
          id="evento"
          className="mt-20 md:mt-28 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-start lg:pt-[10.5rem]"
        >
          <Rise y={12}>
            <dl className="mt-8 border-t border-white/[0.08]">
              {factRows.map(([k, v], i) => (
                <div key={i} className="grid grid-cols-[7.5rem_1fr] gap-4 border-b border-white/[0.08] py-4 md:grid-cols-[8.5rem_1fr] lg:grid-cols-[6.5rem_1fr] xl:grid-cols-[8.5rem_1fr]">
                  <dt className="text-[13px] leading-[1.75] text-white/50">
                    <Rich rich={k} strong="font-light" />
                  </dt>
                  <dd className="text-[15px] leading-[1.6] text-white/90">
                    <Rich rich={v} />
                  </dd>
                </div>
              ))}
            </dl>
          </Rise>
          <Rise y={12} delay={0.05}>
            <Note rich={rich(evento[1])} className="mt-6" />
          </Rise>
          <div className="mt-8 grid gap-3">
            {[evento[2], evento[3]].map((b, i) => (
              <Rise key={i} y={10} delay={0.08 + i * 0.06}>
                <ActionCard rich={rich(b)} mark={i === 0 ? "pin" : "help"} />
              </Rise>
            ))}
          </div>
        </GuideSection>
      </div>

      <nav aria-label="Partes do guia" className="mt-28 md:mt-36">
        <Kicker>continue lendo</Kicker>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(["ideia", "dia"] as PageKey[]).map((k, i) => (
            <Rise key={k} y={16} delay={i * 0.08}>
              <Door page={k} index={i + 1} />
            </Rise>
          ))}
        </div>
      </nav>
    </main>
  );
}

// Thin line marks in the site's palette, standing in for the Notion emoji
// (📍 / 🙋) the organizers asked to drop. 24px grid, 1.4px stroke, currentColor.
const MARKS = {
  pin: (
    <>
      <path d="M12 21s-6.25-5.5-6.25-10.75a6.25 6.25 0 0 1 12.5 0C18.25 15.5 12 21 12 21Z" />
      <circle cx="12" cy="10.25" r="2.1" />
    </>
  ),
  help: (
    <>
      <path d="M5 4.75h14A1.5 1.5 0 0 1 20.5 6.25v8.5a1.5 1.5 0 0 1-1.5 1.5h-7.25L7.5 19.75v-3.5H5a1.5 1.5 0 0 1-1.5-1.5v-8.5A1.5 1.5 0 0 1 5 4.75Z" />
      <path d="M10.25 8.6a1.8 1.8 0 1 1 2.55 1.65c-.47.21-.8.6-.8 1.1v.3" />
      <path d="M12 13.75h.01" />
    </>
  ),
};

/** "Como chegar: abrir…" or "No dia, teve alguma dificuldade?…": line mark, bold lead on top. */
function ActionCard({ rich: r, mark }: { rich: ReturnType<typeof rich>; mark: keyof typeof MARKS }) {
  const { lead, body } = splitLead(clean(r));
  return (
    <div className="grid grid-cols-[1.75rem_1fr] gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="mt-0.5 size-5 text-white/60"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {MARKS[mark]}
      </svg>
      <p className="text-[15px] leading-[1.65] text-white/75">
        <span className="block text-white">
          <Rich rich={lead} strong="font-normal" />
        </span>
        <Rich rich={body} />
      </p>
    </div>
  );
}

function Door({ page, index }: { page: PageKey; index: number }) {
  const p = PAGES[page];
  return (
    <Link
      href={p.href}
      className="group relative flex h-full min-h-[18rem] flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02] p-6 transition-[border-color,background-color,transform] duration-200 ease-out hover:border-white/30 active:scale-[0.99] hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 md:p-8"
    >
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs text-white/45">{String(index).padStart(2, "0")}</span>
        <span
          aria-hidden
          className="grid size-11 place-items-center rounded-full bg-white text-[#000928] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-1 group-hover:-rotate-45"
        >
          →
        </span>
      </div>
      {/* Titles stay level across both doors. "O dia" has 9 sections to "Sua ideia"'s 3:
          on wide screens (xl) its list flows into two columns so both cards end close together. */}
      <div>
        <h2 className="mt-12 text-[2.4rem] font-extralight leading-none tracking-[-0.02em] md:text-[3.25rem]">{p.label}</h2>
        <ul className={`mt-6 grid gap-1.5 ${p.sections.length > 5 ? "xl:grid-flow-col xl:grid-rows-5 xl:gap-x-6" : ""}`}>
          {p.sections.map((id) => {
            const { num, text } = splitTitle(section(id).title);
            if (!text) return null;
            return (
              <li key={id} className="flex gap-3 text-[13px] leading-snug text-white/55 transition-colors duration-200 group-hover:text-white/75">
                <span className="w-6 shrink-0 font-mono text-[11px] leading-[1.6] text-white/30">{num}</span>
                {text}
              </li>
            );
          })}
        </ul>
      </div>
    </Link>
  );
}
