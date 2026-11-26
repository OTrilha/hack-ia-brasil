"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (switching tab)
 *
 *    0ms   white pill glides under the new tab (spring)
 *    0ms   new panel enters from the side you moved toward,
 *          x ±10px → 0, opacity 0 → 1, blur 2px → 0, 250ms
 * ───────────────────────────────────────────────────────── */

const PILL = { spring: { type: "spring" as const, stiffness: 420, damping: 36 } };
const PANEL = {
  offsetX: 10, // px the panel slides in from
  blur: 2, // px of blur at the start
  transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] as const }, // a repeated action: quick
};

/**
 * Accessible tabs (roving focus, arrow keys). Every panel stays in the DOM
 * (inactive ones are `hidden`), so all of the guide text is always there.
 */
export function Tabs({
  label,
  tabs,
}: {
  label: string;
  tabs: { key: string; tab: ReactNode; panel: ReactNode }[];
}) {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const wrap = useRef<HTMLDivElement>(null);

  const go = (i: number, focus = false) => {
    const n = (i + tabs.length) % tabs.length;
    setDir(n >= active ? 1 : -1);
    setActive(n);
    if (focus) refs.current[n]?.focus();
  };

  // keep the tab row in view when switching from the bottom of a long panel
  const first = useRef(true);
  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const top = wrap.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) wrap.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [active, reduce]);

  return (
    <div ref={wrap} className="scroll-mt-20">
      <div
        role="tablist"
        aria-label={label}
        className="flex w-full gap-0.5 overflow-x-auto sm:inline-flex sm:gap-1 sm:w-auto sm:max-w-full rounded-full border border-white/10 bg-white/[0.02] p-1 [scrollbar-width:none]"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(active + 1, true);
          else if (e.key === "ArrowLeft") go(active - 1, true);
          else if (e.key === "Home") go(0, true);
          else if (e.key === "End") go(tabs.length - 1, true);
          else return;
          e.preventDefault();
        }}
      >
        {tabs.map((t, i) => {
          const on = i === active;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${i}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${i}`}
              tabIndex={on ? 0 : -1}
              onClick={() => go(i)}
              className={`relative flex-1 shrink-0 rounded-full px-2 py-2.5 text-[14px] max-[359px]:text-[13px] sm:flex-none sm:px-4 sm:text-[15px] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70 md:px-6 md:text-base ${
                on ? "text-[#000928]" : "text-white/70 hover:text-white"
              }`}
            >
              {on && (
                <motion.span layoutId={`${base}-pill`} className="absolute inset-0 rounded-full bg-white" transition={PILL.spring} />
              )}
              <span className="relative whitespace-nowrap">{t.tab}</span>
            </button>
          );
        })}
      </div>
      {tabs.map((t, i) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          hidden={i !== active}
          tabIndex={0}
          className="mt-10 focus-visible:outline-none"
        >
          {i === active ? (
            <motion.div
              key={`${t.key}-shown`}
              initial={reduce ? false : { opacity: 0, x: dir * PANEL.offsetX, filter: `blur(${PANEL.blur}px)` }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={PANEL.transition}
            >
              {t.panel}
            </motion.div>
          ) : (
            t.panel
          )}
        </div>
      ))}
    </div>
  );
}
