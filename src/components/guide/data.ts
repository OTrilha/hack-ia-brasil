// Helpers over the verbatim guide text in src/guide/content.ts.
// Nothing here rewrites copy: it only finds sections, splits a rich line at
// its bold lead, and maps "seção N" to the page that now holds section N.

import { GUIDE, type Block, type Rich, type Section } from "@/guide/content";

export type PageKey = "hub" | "ideia" | "dia";

/** The three screens of the web guide. `label` is UI chrome, kept short. */
export const PAGES: Record<PageKey, { href: string; label: string; sections: string[] }> = {
  hub: { href: "/guia", label: "Início", sections: ["intro", "checklist", "evento"] },
  ideia: { href: "/guia/ideia", label: "Sua ideia", sections: ["esperamos", "tracks", "escopo"] },
  dia: {
    href: "/guia/dia",
    label: "O dia",
    sections: [
      "programacao",
      "participacao",
      "levar",
      "submissao",
      "criterios",
      "pitch",
      "premiacao",
      "faq",
      "regras",
      "outro",
    ],
  },
};

export const PAGE_ORDER: PageKey[] = ["hub", "ideia", "dia"];

export function section(id: string): Section {
  const s = GUIDE.find((x) => x.id === id);
  if (!s) throw new Error(`guide section not found: ${id}`);
  return s;
}

/** "3. As tracks" → { num: "3.", text: "As tracks" }. */
export function splitTitle(title: string | null): { num: string | null; text: string } {
  if (!title) return { num: null, text: "" };
  const m = title.match(/^(\d+\.)\s+(.*)$/);
  return m ? { num: m[1], text: m[2] } : { num: null, text: title };
}

function pageOf(id: string): PageKey {
  return PAGE_ORDER.find((k) => PAGES[k].sections.includes(id)) ?? "hub";
}

/** href for a section anchor, wherever it lives now. */
export function sectionHref(id: string): string {
  return `${PAGES[pageOf(id)].href}#${id}`;
}

/** Section number (as written in its title) → href. Used to turn "seção 3" into a link. */
export const SECTION_BY_NUM: Record<string, string> = Object.fromEntries(
  GUIDE.flatMap((s) => {
    const n = s.title?.match(/^(\d+)\./)?.[1];
    return n ? [[n, sectionHref(s.id)]] : [];
  }),
);

// The Notion export opens some lines with emoji ("☀️ 08h00", "🔒 Segurança", "📍 ").
// The organizers asked for none in the UI, so they are stripped at render time:
// a leading run of pictographs (+ VS16 / ZWJ / skin-tone modifiers) and the space
// after it. content.ts itself stays the verbatim export.
const LEADING_EMOJI = /^(?:[\p{Extended_Pictographic}\p{Regional_Indicator}][\u{FE0F}\u{200D}\p{Extended_Pictographic}\p{Emoji_Modifier}]*\s*)+/u;
export const stripEmoji = (t: string) => t.replace(LEADING_EMOJI, "");

/** Rich text without leading emoji; spans left empty are dropped. */
export const clean = (rich: Rich): Rich =>
  rich.map((s) => ({ ...s, t: stripEmoji(s.t) })).filter((s) => s.t.length > 0);

export const plain = (rich: Rich) => clean(rich).map((s) => s.t).join("");

/**
 * Split a line that opens with a bold run ("**Pax**: a startup…") into
 * lead and body without dropping a character: punctuation glued to the end of
 * the lead (":" or ",") stays with the lead, the space after it is the seam.
 */
export function splitLead(rich: Rich): { lead: Rich; body: Rich } {
  if (!rich[0]?.b) return { lead: [], body: rich };
  const lead: Rich = [rich[0]];
  const rest = rich.slice(1);
  const next = rest[0];
  if (next && !next.b && !next.href) {
    const m = next.t.match(/^([:,.]?)(\s*)([\s\S]*)$/)!;
    if (m[1]) lead.push({ t: m[1] });
    rest[0] = { ...next, t: m[3] };
    if (!rest[0].t) rest.shift();
  }
  return { lead, body: rest };
}

/** A paragraph that is nothing but one bold run reads as a small heading. */
export const isBoldOnly = (b: Block) =>
  b.kind === "p" && b.rich.length === 1 && !!b.rich[0].b && !b.rich[0].t.includes("\n");

/** Narrowing helpers so section layouts can pull blocks by index with types. */
export function rich(b: Block): Rich {
  if (b.kind === "p" || b.kind === "h3" || b.kind === "quote") return b.rich;
  throw new Error(`expected a rich block, got ${b.kind}`);
}
export function items(b: Block): Rich[] {
  if (b.kind === "ul" || b.kind === "ol" || b.kind === "todo") return b.items;
  throw new Error(`expected a list block, got ${b.kind}`);
}
export function table(b: Block): { head: Rich[]; rows: Rich[][] } {
  if (b.kind === "table") return b;
  throw new Error(`expected a table block, got ${b.kind}`);
}
