"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useState } from "react";

export type IndexItem = { id: string; num: string | null; label: string };

const RAIL = {
  spring: { type: "spring" as const, stiffness: 380, damping: 34 }, // active marker glide
};
const SHEET = {
  spring: { type: "spring" as const, stiffness: 420, damping: 38 },
  offsetY: 12, // px the sheet rises from
};

const PILL = {
  // Hide while reading down, come back on any scroll up. Like Safari's toolbar:
  // the pill never covers the line you're reading, and it's there when you look for it.
  threshold: 12, // px of travel in one direction before toggling
  topZone: 120, // px from the top where it always shows
};

function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = scrollY;
    let acc = 0;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = scrollY;
        const dy = y - last;
        last = y;
        // same direction accumulates, a reversal starts over
        acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
        const atEnd = innerHeight + y >= document.documentElement.scrollHeight - 4;
        if (y < PILL.topZone || atEnd) setHidden(false);
        else if (acc > PILL.threshold) setHidden(true);
        else if (acc < -PILL.threshold) setHidden(false);
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return hidden;
}

/** Which section is under the reading line (40% from the top of the viewport). */
function useActive(key: string) {
  const [active, setActive] = useState(key.split("|")[0]);
  useEffect(() => {
    const els = key.split("|").map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-40% 0px -59% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

/**
 * Section index for long screens. Desktop: a sticky rail on the left.
 * Phone: a floating pill at the bottom (thumb reach) that opens the list.
 */
export function SectionIndex({ items, label }: { items: IndexItem[]; label: string }) {
  const active = useActive(items.map((i) => i.id).join("|"));
  const [open, setOpen] = useState(false);
  const scrolledAway = useHideOnScrollDown();
  const hidden = scrolledAway && !open;
  const current = items.find((i) => i.id === active) ?? items[0];
  const pos = items.indexOf(current);

  // Activity keeps this page alive when hidden: never come back with the sheet open.
  useLayoutEffect(() => () => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {/* desktop rail */}
      <nav aria-label={label} className="sticky top-24 hidden self-start lg:block">
        <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.3em] text-white/50">{label}</p>
        <ul className="relative border-l border-white/[0.08]">
          {items.map((it) => {
            const on = it.id === active;
            return (
              <li key={it.id} className="relative">
                {on && (
                  <motion.span
                    layoutId={`rail-${label}`}
                    className="absolute -left-px top-0 h-full w-px bg-white"
                    transition={RAIL.spring}
                  />
                )}
                <a
                  href={`#${it.id}`}
                  aria-current={on ? "location" : undefined}
                  className={`flex gap-3 py-2 pl-5 text-[13px] leading-snug transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 ${
                    on ? "text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <span className="w-6 shrink-0 font-mono text-[11px] leading-[1.6] text-white/35">{it.num}</span>
                  <span>{it.label}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* phone pill + sheet */}
      {/* CSS transition, not a spring: it's retargeted mid-flight every time the
          reader changes direction. Exit is quicker than the return. */}
      <div
        data-hidden={hidden || undefined}
        inert={hidden}
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] data-[hidden]:translate-y-[calc(100%+0.5rem)] data-[hidden]:opacity-0 data-[hidden]:duration-200 motion-reduce:data-[hidden]:translate-y-0 lg:hidden"
      >
        <div className="pointer-events-auto relative w-full max-w-sm">
          <AnimatePresence>
            {open && (
              <motion.nav
                id="guide-index-sheet"
                aria-label={label}
                initial={{ opacity: 0, y: SHEET.offsetY, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: SHEET.offsetY, scale: 0.98 }}
                transition={SHEET.spring}
                className="absolute inset-x-0 bottom-[calc(100%+0.5rem)] max-h-[60svh] origin-bottom overflow-y-auto rounded-2xl border border-white/10 bg-[#0b0b0d]/95 p-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              >
                <ul>
                  {items.map((it) => {
                    const on = it.id === active;
                    return (
                      <li key={it.id}>
                        <a
                          href={`#${it.id}`}
                          onClick={() => setOpen(false)}
                          className={`flex gap-3 rounded-xl px-3 py-3 text-[15px] leading-snug transition-colors ${
                            on ? "bg-white/[0.07] text-white" : "text-white/70 active:bg-white/[0.05]"
                          }`}
                        >
                          <span className="w-6 shrink-0 font-mono text-[11px] leading-[1.9] text-white/40">{it.num}</span>
                          <span>{it.label}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </motion.nav>
            )}
          </AnimatePresence>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="guide-index-sheet"
            onClick={() => setOpen((o) => !o)}
            className="flex w-full items-center gap-3 rounded-full border border-white/10 bg-[#0b0b0d]/90 py-2.5 pl-4 pr-3 text-left shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-transform duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60"
          >
            <span className="font-mono text-[11px] tabular-nums text-white/45">
              {pos + 1}/{items.length}
            </span>
            <span className="relative min-w-0 flex-1 overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={current.id}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={RAIL.spring}
                  className="block truncate text-sm text-white"
                >
                  {current.label}
                </motion.span>
              </AnimatePresence>
            </span>
            <motion.span
              aria-hidden
              animate={{ rotate: open ? 180 : 0 }}
              transition={RAIL.spring}
              className="grid size-7 place-items-center rounded-full bg-white/[0.08] text-xs text-white/80"
            >
              ↑
            </motion.span>
          </button>
        </div>
      </div>
    </>
  );
}
