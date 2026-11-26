import type { ReactNode } from "react";
import type { Block, Rich as RichT } from "@/guide/content";
import { Scramble } from "@/components/fx/scramble";
import { Rise } from "./rise";
import { Rich } from "./rich";
import { isBoldOnly, section, splitLead, splitTitle } from "./data";

// Type scale for the guide (kept to five steps so long pages stay calm):
//   display   clamp(2.1rem, 6vw, 3.6rem) extralight   page / hero titles
//   title     1.75rem → 2.5rem extralight             section titles
//   subtitle  1.25rem → 1.5rem extralight             h3 inside a section
//   body      15px → 16px light, white/75, 1.75 lead  paragraphs
//   label     11px mono uppercase 0.3em               UI chrome only

/** Mono uppercase label: UI chrome only, never guide copy. */
export function Kicker({ children, className = "" }: { children: string; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.3em] text-white/60 ${className}`}>
      <Scramble text={children} />
    </p>
  );
}

/** One guide section: anchor, number + title, body. */
export function GuideSection({
  id,
  children,
  className = "",
  hideTitle = false,
}: {
  id: string;
  children: ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  const { num, text } = splitTitle(section(id).title);
  return (
    <section
      id={id}
      data-guide-section
      aria-labelledby={text && !hideTitle ? `${id}-title` : undefined}
      className={`min-w-0 scroll-mt-24 ${className}`}
    >
      {text && !hideTitle && (
        <Rise y={16}>
          <h2 id={`${id}-title`} className="flex items-baseline gap-4 text-[1.75rem] font-extralight leading-[1.15] tracking-[-0.01em] md:text-[2.5rem]">
            {num && <span className="font-mono text-sm font-normal tracking-normal text-white/40 md:text-base">{num}</span>}
            <span className="text-balance">{text}</span>
          </h2>
        </Rise>
      )}
      {children}
    </section>
  );
}

export function P({ rich, className = "" }: { rich: RichT; className?: string }) {
  return (
    <p className={`max-w-[62ch] text-pretty text-[15px] leading-[1.75] text-white/75 md:text-base ${className}`}>
      <Rich rich={rich} />
    </p>
  );
}

/** Larger opening paragraph of a section. */
export function Lead({ rich, className = "" }: { rich: RichT; className?: string }) {
  return (
    <p className={`max-w-[58ch] text-pretty text-[17px] font-light leading-[1.65] text-white/85 md:text-lg ${className}`}>
      <Rich rich={rich} strong="font-normal text-white bg-white/[0.08] px-1 -mx-1 rounded-[3px]" />
    </p>
  );
}

/** A line that introduces a list ("Direções que valem explorar:"). */
export function Intro({ rich, className = "" }: { rich: RichT; className?: string }) {
  return (
    <p className={`text-[15px] font-normal leading-relaxed text-white/90 md:text-base ${className}`}>
      <Rich rich={rich} />
    </p>
  );
}

/** A paragraph that is only a bold run, shown as a small heading. */
export function MiniHeading({ rich, className = "" }: { rich: RichT; className?: string }) {
  return (
    <h3 className={`text-lg font-light text-white md:text-xl ${className}`}>
      <Rich rich={rich} strong="font-light" />
    </h3>
  );
}

export function H3({ rich, className = "" }: { rich: RichT; className?: string }) {
  return (
    <h3 className={`text-[1.35rem] font-extralight leading-snug text-white md:text-[1.6rem] ${className}`}>
      <Rich rich={rich} />
    </h3>
  );
}

/** Quiet aside: a hairline on the left, smaller text. */
export function Note({ rich, className = "" }: { rich: RichT; className?: string }) {
  return (
    <p className={`max-w-[62ch] border-l border-white/20 pl-4 text-sm leading-relaxed text-white/65 ${className}`}>
      <Rich rich={rich} />
    </p>
  );
}

/** Bulleted list with a short dash marker, bold leads kept inline. */
export function Bullets({ items, className = "", ordered = false }: { items: RichT[]; className?: string; ordered?: boolean }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`grid gap-3 ${className}`}>
      {items.map((it, i) => (
        <li key={i} className="grid grid-cols-[1.25rem_1fr] gap-2 text-[15px] leading-[1.7] text-white/75 md:text-base">
          <span aria-hidden className="pt-[0.05em] font-mono text-xs leading-[2.2] text-white/35">
            {ordered ? String(i + 1).padStart(2, "0") : "—"}
          </span>
          <span>
            <Rich rich={it} />
          </span>
        </li>
      ))}
    </Tag>
  );
}

/** Rows with the bold lead in its own column ("Conduta." | text). */
export function LeadRows({ items, className = "" }: { items: RichT[]; className?: string }) {
  return (
    <dl className={`border-t border-white/[0.08] ${className}`}>
      {items.map((it, i) => {
        const { lead, body } = splitLead(it);
        return (
          <Rise key={i} y={10} delay={Math.min(i, 4) * 0.05} className="grid gap-2 border-b border-white/[0.08] py-6 md:grid-cols-[13rem_1fr] md:gap-10">
              <dt className="text-[15px] font-normal text-white md:text-base">
                <Rich rich={lead} strong="font-normal" />
              </dt>
              <dd className="max-w-[62ch] text-[15px] leading-[1.75] text-white/75 md:text-base">
                <Rich rich={body} />
              </dd>
          </Rise>
        );
      })}
    </dl>
  );
}

/** Fallback renderer for a block that needs no special layout. */
export function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case "p":
      return isBoldOnly(block) ? <MiniHeading rich={block.rich} /> : <P rich={block.rich} />;
    case "h3":
      return <H3 rich={block.rich} />;
    case "quote":
      return <PullQuote rich={block.rich} />;
    case "ul":
    case "todo":
      return <Bullets items={block.items} />;
    case "ol":
      return <Bullets items={block.items} ordered />;
    case "table":
      return null;
  }
}

export function PullQuote({ rich }: { rich: RichT }) {
  return (
    <Rise>
      <blockquote className="max-w-2xl text-balance py-2 text-[1.6rem] font-extralight leading-[1.3] text-white md:text-[2.25rem]">
        <Rich rich={rich} />
      </blockquote>
    </Rise>
  );
}
