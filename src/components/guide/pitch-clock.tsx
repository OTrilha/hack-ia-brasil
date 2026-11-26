"use client";

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Rich as RichT } from "@/guide/content";
import { Rich } from "./rich";
import { plain, splitLead } from "./data";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (scroll into view, or tap ▶)
 *
 *          waits until the bar AND the four steps are on screen
 *          (on a phone the list is ~500px tall: starting earlier
 *          would light steps below the fold)
 *    0ms   clock reads 0:00, every step dim
 *  250ms   playhead starts: 3 pitch minutes run in 4.5s (40×)
 *          each segment fills as the playhead crosses it,
 *          and its step lights up below
 *  end     clock rests on 3:00, all steps settle to full white
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  startDelay: 250, // ms after the whole block is in view
  inView: 0.8, // share of the block that must be visible
  speed: 40, // pitch seconds per real second
};
const STEP = {
  idle: 0.4, // opacity of a step the playhead hasn't reached
  live: 1,
  done: 0.85,
};

const secondsOf = (it: RichT) => Number(plain(it).match(/\((\d+)s\)/)?.[1] ?? 30);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Segment({ t, from, len }: { t: MotionValue<number>; from: number; len: number }) {
  const scaleX = useTransform(t, [from, from + len], [0, 1], { clamp: true });
  return (
    <span className="relative h-1.5 overflow-hidden rounded-full bg-white/10" style={{ flexGrow: len }}>
      <motion.span className="absolute inset-0 origin-left rounded-full bg-white" style={{ scaleX }} />
    </span>
  );
}

export function PitchClock({ items }: { items: RichT[] }) {
  const secs = items.map(secondsOf);
  const total = secs.reduce((a, b) => a + b, 0);
  const starts = secs.map((_, i) => secs.slice(0, i).reduce((a, b) => a + b, 0));

  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: TIMING.inView });
  const t = useMotionValue(0);
  const [sec, setSec] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [replay, setReplay] = useState(0);

  useMotionValueEvent(t, "change", (v) => setSec(Math.floor(v)));

  // One key for "what started this run": -1 idle, 0 scrolled into view, n = nth tap.
  // A tap before the block is in view keeps its run when inView flips later.
  const run = replay > 0 ? replay : inView ? 0 : -1;

  useEffect(() => {
    if (run < 0) return;
    if (reduce) {
      t.set(total);
      return;
    }
    t.set(0);
    let ctl: ReturnType<typeof animate> | undefined;
    const timer = setTimeout(() => {
      setPlaying(true);
      ctl = animate(t, total, {
        duration: total / TIMING.speed,
        ease: "linear",
        onComplete: () => setPlaying(false),
      });
    }, run > 0 ? 0 : TIMING.startDelay); // a tap answers at once
    return () => {
      clearTimeout(timer);
      ctl?.stop();
    };
  }, [run, reduce, t, total]);

  const finished = sec >= total;
  const activeIdx = finished ? -1 : starts.reduce((acc, s, i) => (sec >= s ? i : acc), -1);

  return (
    <div ref={ref}>
      <div className="flex items-center gap-4">
        <button
          type="button"
          // never disabled: a tap mid-run restarts from 0:00
          onClick={() => setReplay((r) => r + 1)}
          aria-label={playing || finished ? "Tocar de novo" : "Tocar"}
          className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 text-[11px] text-white/80 transition-[border-color,color,transform] duration-150 ease-out hover:border-white/40 hover:text-white active:scale-[0.94] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/70"
        >
          {playing || finished ? "↺" : "▶"}
        </button>
        <span aria-hidden className="w-12 font-mono text-sm tabular-nums text-white">
          {clock(Math.min(sec, total))}
        </span>
        <span aria-hidden className="flex flex-1 gap-1">
          {secs.map((len, i) => (
            <Segment key={i} t={t} from={starts[i]} len={len} />
          ))}
        </span>
        <span aria-hidden className="font-mono text-sm tabular-nums text-white/40">
          {clock(total)}
        </span>
      </div>
      <ol className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-2">
        {items.map((it, i) => {
          const { lead, body } = splitLead(it);
          // "(30s): quem sofre…" → the duration sits on the title line, in order
          const m = body[0]?.t.match(/^(\(\d+s\):?)\s*([\s\S]*)$/);
          const dur = m?.[1] ?? "";
          const rest = m ? [{ ...body[0], t: m[2] }, ...body.slice(1)] : body;
          const state = i === activeIdx ? STEP.live : finished || i < activeIdx ? STEP.done : sec === 0 && !playing ? STEP.done : STEP.idle;
          return (
            <motion.li
              key={i}
              animate={{ opacity: state }}
              transition={{ duration: 0.25 }}
              className={`relative p-5 transition-colors duration-200 md:p-6 ${i === activeIdx ? "bg-[#0b0b0b]" : "bg-black"}`}
            >
              <span aria-hidden className="font-mono text-[11px] text-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <p className="mt-3 flex items-baseline gap-2 text-lg font-light text-white md:text-xl">
                <Rich rich={lead} strong="font-light" />{" "}
                <span className="font-mono text-xs tabular-nums text-white/50">{dur}</span>
              </p>
              <p className="mt-2 text-[14px] leading-relaxed text-white/75 md:text-[15px]">
                <Rich rich={rest} />
              </p>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
