"use client";

import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import type { Rich as RichT } from "@/guide/content";
import { Rich } from "./rich";
import { enterDelay, useFirstScreen } from "./rise";
import { plain } from "./data";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (scroll into view)
 *
 *    0ms   spine draws top → bottom (scaleY 0 → 1)
 *   80ms   rows rise in, 6px, staggered 45ms
 *  on 28/11 the slot happening now carries a pulsing "agora" dot
 * ───────────────────────────────────────────────────────── */

const SPINE = { duration: 1.1, ease: [0.22, 1, 0.36, 1] as const };
const ROWS = { delay: 0.08, stagger: 0.045, offsetY: 6, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

// The event runs in João Pessoa (UTC-3, no DST).
const DAY = "2026-11-28";
const at = (hhmm: string) => new Date(`${DAY}T${hhmm}:00-03:00`).getTime();

/** "08h00" or "10h30 às 11h20" (emoji already stripped by `plain`) → time + start. */
function parseSlot(cell: RichT) {
  const time = plain(cell);
  const t = time.match(/(\d{2})h(\d{2})/);
  return { time, start: t ? at(`${t[1]}:${t[2]}`) : 0 };
}

// minute clock as an external store, null on the server
function subscribeClock(cb: () => void) {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
}
const minuteNow = () => Math.floor(Date.now() / 60_000) * 60_000;

export function Schedule({ head, rows }: { head: RichT[]; rows: RichT[][] }) {
  const now = useSyncExternalStore(subscribeClock, minuteNow, () => null);
  // on the first screen the rows can't wait for hydration: CSS entrance, rows already "shown"
  const first = useFirstScreen();
  const slots = rows.map((r) => ({ ...parseSlot(r[0]), what: r[1] }));
  const end = at("18:30");
  let current = -1;
  if (now !== null && now >= slots[0].start - 30 * 60_000 && now < end) {
    slots.forEach((s, i) => {
      if (now >= s.start) current = i;
    });
    if (current === -1) current = 0;
  }

  return (
    <div {...(first ? { "data-enter": true, style: enterDelay(120) } : {})}>
      <div className="grid grid-cols-[2.25rem_6.5rem_1fr] gap-x-3 border-b border-white/[0.08] pb-3 font-mono text-[11px] uppercase tracking-[0.25em] text-white/50 md:grid-cols-[2.5rem_9rem_1fr]">
        <span />
        <span>
          <Rich rich={head[0]} strong="font-normal" />
        </span>
        <span>
          <Rich rich={head[1]} strong="font-normal" />
        </span>
      </div>
      <motion.ol
        className="relative"
        initial={first ? "shown" : "hidden"}
        whileInView="shown"
        viewport={{ once: true, margin: "-10% 0px" }}
      >
        <motion.span
          aria-hidden
          className="absolute bottom-3 left-[1.05rem] top-3 w-px origin-top bg-white/12 md:left-[1.2rem]"
          variants={{ hidden: { scaleY: 0 }, shown: { scaleY: 1, transition: SPINE } }}
        />
        {slots.map((s, i) => {
          const on = i === current;
          const past = current > -1 && i < current;
          return (
            <motion.li
              key={i}
              variants={{
                hidden: { opacity: 0, y: ROWS.offsetY },
                shown: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: ROWS.duration, ease: ROWS.ease, delay: ROWS.delay + i * ROWS.stagger },
                },
              }}
              className={`group relative grid grid-cols-[2.25rem_6.5rem_1fr] items-baseline gap-x-3 py-3.5 transition-colors duration-300 md:grid-cols-[2.5rem_9rem_1fr] ${
                on ? "text-white" : past ? "text-white/45" : "text-white/75 hover:text-white"
              }`}
            >
              {/* node on the spine: hollow ahead, dim when past, filled when now */}
              <span aria-hidden className="relative z-10 grid h-[1.9em] place-items-center self-start font-mono text-xs md:text-[13px]">
                <span
                  className={`size-[7px] rounded-full border transition-colors duration-300 ${
                    on ? "border-white bg-white" : past ? "border-white/25 bg-white/25" : "border-white/45 bg-black group-hover:border-white"
                  }`}
                />
              </span>
              <span className="font-mono text-xs tabular-nums leading-[1.9] md:text-[13px]">{s.time}</span>
              <span className="text-[15px] leading-[1.6] md:text-base">
                <Rich rich={s.what} />
                {on && (
                  <span className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-white px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#000928]">
                    <span className="relative flex size-1.5">
                      <span className="absolute inset-0 animate-ping rounded-full bg-[#000928]/60 motion-reduce:animate-none" />
                      <span className="relative size-1.5 rounded-full bg-[#000928]" />
                    </span>
                    agora
                  </span>
                )}
              </span>
            </motion.li>
          );
        })}
      </motion.ol>
    </div>
  );
}
