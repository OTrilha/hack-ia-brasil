"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef, useSyncExternalStore } from "react";
import type { Rich as RichT } from "@/guide/content";
import { RollingDigits } from "@/components/fx/rolling-digits";
import { dotRipple } from "@/components/fx/click-dots";
import { Rich } from "./rich";
import { splitLead } from "./data";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (one tap)
 *
 *    0ms   press anywhere on the row: box squeezes to 0.9 (CSS, 120ms)
 *    0ms   box fills white
 *   40ms   check stroke draws 0 → 1 (240ms); unticking erases in 120ms
 *  120ms   counter digit rolls, progress hairline grows
 *          text settles to a quieter white
 *  last    when the final item is ticked, dust ripples out from it
 * ───────────────────────────────────────────────────────── */

// Press feedback is plain CSS on the row (group-active), so tapping the text
// squeezes the box too, not only a direct hit on the 18px square.
const CHECK = {
  delay: 0.04, // s after the fill
  draw: { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const },
  erase: { duration: 0.12, ease: [0.23, 1, 0.32, 1] as const }, // exit faster than enter
};
const BAR = {
  spring: { type: "spring" as const, stiffness: 140, damping: 22 },
};

// One tiny store for every checklist in the guide, kept in localStorage so a
// participant can come back from WhatsApp and find their ticks.
const KEY = "guia:checks:v1";
type State = Record<string, number[]>;
const EMPTY: number[] = [];
let cache: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}") as State;
  } catch {
    cache = {};
  }
  return cache;
}
function write(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    removeEventListener("storage", onStorage);
  };
}

function useChecks(id: string) {
  const checked = useSyncExternalStore(
    subscribe,
    () => read()[id] ?? EMPTY,
    () => EMPTY,
  );
  const toggle = (i: number) => {
    const cur = read()[id] ?? EMPTY;
    const next = cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i].sort((a, b) => a - b);
    write({ ...read(), [id]: next });
    return next;
  };
  return { checked, toggle };
}

export function Checklist({
  id,
  items,
  variant = "plain",
  doneLabel = "tudo pronto",
}: {
  id: string;
  items: RichT[];
  /** plain: one line each. lead: bold lead on its own line. numbered: big index + lead. */
  variant?: "plain" | "lead" | "numbered";
  doneLabel?: string;
}) {
  const { checked, toggle } = useChecks(id);
  const reduce = useReducedMotion();
  const boxes = useRef<(HTMLSpanElement | null)[]>([]);
  const done = checked.length;
  const all = done === items.length;

  const onToggle = (i: number) => {
    const next = toggle(i);
    if (next.length === items.length && !reduce) {
      const r = boxes.current[i]?.getBoundingClientRect();
      if (r) dotRipple(r.left + r.width / 2, r.top + r.height / 2);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 pb-4" aria-live="polite">
        <span className="flex items-baseline gap-1 font-mono text-xs tabular-nums text-white/80">
          <RollingDigits value={String(done)} />
          <span className="text-white/40">/{items.length}</span>
        </span>
        <span className="relative flex-1">
        <span className="relative block h-px overflow-hidden bg-white/10">
          <motion.span
            className="absolute inset-0 origin-left bg-white"
            initial={false}
            animate={{ scaleX: items.length ? done / items.length : 0 }}
            transition={BAR.spring}
          />
        </span>
        <motion.span
          className="absolute bottom-full right-0 mb-2.5 font-mono text-[11px] uppercase tracking-[0.3em] text-white"
          initial={false}
          animate={{ opacity: all ? 1 : 0, y: all ? 0 : 4 }}
          transition={BAR.spring}
          aria-hidden={!all}
        >
          {doneLabel}
        </motion.span>
        </span>
      </div>
      <ul className="border-t border-white/[0.08]">
        {items.map((it, i) => {
          const on = checked.includes(i);
          const { lead, body } = variant === "plain" ? { lead: [], body: it } : splitLead(it);
          return (
            <li key={i} className="border-b border-white/[0.08]">
              <label
                className={`group grid cursor-pointer items-start gap-4 py-4 md:py-5 ${
                  variant === "numbered" ? "grid-cols-[2.25rem_1fr_auto]" : "grid-cols-[auto_1fr]"
                }`}
              >
                {variant === "numbered" && (
                  <span aria-hidden className="pt-1 font-mono text-xs text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={on}
                  onChange={() => onToggle(i)}
                />
                <span
                  ref={(el) => {
                    boxes.current[i] = el;
                  }}
                  aria-hidden
                  className={`mt-[3px] grid size-[18px] shrink-0 place-items-center rounded-[4px] border transition-[background-color,border-color,transform] duration-150 ease-out group-active:scale-90 peer-focus-visible:ring-2 peer-focus-visible:ring-white/70 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-black ${
                    on ? "border-white bg-white" : "border-white/35 group-hover:border-white/70"
                  } ${variant === "numbered" ? "order-last" : ""}`}
                >
                  <svg viewBox="0 0 16 16" className="size-3" fill="none">
                    <motion.path
                      d="M3.5 8.5l3 3 6-7"
                      stroke="#000928"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={false}
                      animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                      transition={on ? { ...CHECK.draw, delay: CHECK.delay } : CHECK.erase}
                    />
                  </svg>
                </span>
                <span
                  className={`text-[15px] leading-[1.65] transition-colors duration-300 md:text-base ${
                    on ? "text-white/45" : "text-white/80"
                  }`}
                >
                  {lead.length > 0 && (
                    <span className={`block font-normal transition-colors duration-300 ${on ? "text-white/55" : "text-white"}`}>
                      <Rich rich={lead} strong="font-normal" />
                    </span>
                  )}
                  <span className={lead.length > 0 ? "mt-0.5 block text-[14px] md:text-[15px]" : ""}>
                    <Rich rich={body} />
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
