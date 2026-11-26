"use client";

import { Fragment, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Scramble } from "@/components/fx/scramble";
import css from "./hero.module.css";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (first paint, CSS only, see hero.module.css)
 *
 *    0ms   kicker decodes from noise (Scramble, after hydration)
 *   60ms   meta line fades in
 *  100ms   title words rise out of their line, staggered 40ms
 *  260ms   lead paragraph un-blurs, y 10 → 0
 *  380ms   trailing slot (call to action) fades in
 *  ~1.0s   everything settled; the lead is readable by ~0.6s
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  meta: 60,
  title: 100,
  wordStagger: 40,
  lead: 260,
  after: 380,
  done: 1300, // after this the entrance never replays (Activity)
};

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function GuideHero({
  kicker,
  meta,
  title,
  lead,
  after,
}: {
  kicker: string;
  meta?: ReactNode;
  /** plain string so the words can rise one by one */
  title: string;
  lead?: ReactNode;
  after?: ReactNode;
}) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), TIMING.done);
    return () => clearTimeout(t);
  }, []);

  return (
    <header className={`${css.hero} ${done ? css.done : ""} pt-10 md:pt-24`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/60">
        <Scramble text={kicker} />
      </p>
      {meta && (
        <div className={`${css.fade} mt-3 text-[13px] text-white/45`} style={d(TIMING.meta)}>
          {meta}
        </div>
      )}
      <h1
        className="mt-6 max-w-[14em] text-balance text-[clamp(2.1rem,7vw,3.75rem)] font-extralight leading-[1.04] tracking-[-0.02em] text-white md:mt-8"
        aria-label={title}
      >
        {title.split(" ").map((w, i) => (
          // the space sits between the clipping boxes: inside an inline-block it would collapse
          <Fragment key={i}>
            {i > 0 && " "}
            <span aria-hidden className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <span className={css.word} style={d(TIMING.title + i * TIMING.wordStagger)}>
                {w}
              </span>
            </span>
          </Fragment>
        ))}
      </h1>
      {lead && (
        <div className={`${css.soft} mt-6 md:mt-8`} style={d(TIMING.lead)}>
          {lead}
        </div>
      )}
      {after && (
        <div className={`${css.fade} mt-8 md:mt-10`} style={d(TIMING.after)}>
          {after}
        </div>
      )}
    </header>
  );
}
