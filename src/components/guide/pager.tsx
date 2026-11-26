import Link from "next/link";
import { PAGES, PAGE_ORDER, type PageKey } from "./data";

/** Previous / next screen at the foot of a guide page. */
export function Pager({ current }: { current: PageKey }) {
  const i = PAGE_ORDER.indexOf(current);
  const prev = PAGE_ORDER[i - 1];
  const next = PAGE_ORDER[i + 1];
  return (
    <nav aria-label="Navegar no guia" className="grid gap-3 border-t border-white/[0.08] pt-10 sm:grid-cols-2">
      {prev ? <PagerLink k={prev} dir="prev" /> : <span className="hidden sm:block" />}
      {next ? (
        <PagerLink k={next} dir="next" />
      ) : (
        <PagerLink k="hub" dir="home" />
      )}
    </nav>
  );
}

function PagerLink({ k, dir }: { k: PageKey; dir: "prev" | "next" | "home" }) {
  const p = PAGES[k];
  const isNext = dir !== "prev";
  return (
    <Link
      href={p.href}
      className={`group flex items-center gap-4 rounded-2xl border border-white/[0.08] px-5 py-5 transition-colors duration-300 hover:border-white/25 hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 ${
        isNext ? "justify-between sm:col-start-2" : ""
      }`}
    >
      {!isNext && (
        <span aria-hidden className="text-white/60 transition-transform duration-300 group-hover:-translate-x-1">
          ←
        </span>
      )}
      <span className={isNext ? "" : "flex-1"}>
        <span className="block text-xl font-extralight text-white md:text-2xl">{p.label}</span>
      </span>
      {isNext && (
        <span
          aria-hidden
          className={`text-white/60 transition-transform duration-300 ${dir === "home" ? "group-hover:-translate-y-1" : "group-hover:translate-x-1"}`}
        >
          {dir === "home" ? "↑" : "→"}
        </span>
      )}
    </Link>
  );
}
