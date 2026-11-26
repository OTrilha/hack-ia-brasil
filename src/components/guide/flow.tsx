"use client";

import { motion } from "motion/react";
import type { Rich as RichT } from "@/guide/content";
import { Rich } from "./rich";
import { splitLead } from "./data";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (scroll into view)
 *
 *    0ms   rail draws down, scaleY 0 → 1 over 600ms
 *    0ms   node 1 dot grows in (scale 0.5 → 1, fading), text rises 8px
 *  120ms   node 2 …  (staggered 120ms, so the eye walks the chain)
 * ───────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const RAIL = { duration: 0.6, ease: EASE }; // lands with the last node
const NODE = {
  stagger: 0.12, // s between nodes
  offsetY: 8, // px
  dot: { type: "spring" as const, duration: 0.45, bounce: 0.15 },
  text: { duration: 0.55, ease: EASE },
};

/** Problema → Causa → Solução → Impacto, as a chain the eye can walk. */
export function Flow({ items, className = "" }: { items: RichT[]; className?: string }) {
  return (
    <motion.ol
      className={`relative ${className}`}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-15% 0px" }}
    >
      <motion.span
        aria-hidden
        className="absolute bottom-8 left-[7px] top-3 w-px origin-top bg-gradient-to-b from-white/50 via-white/25 to-white/50"
        variants={{ hidden: { scaleY: 0 }, shown: { scaleY: 1, transition: RAIL } }}
      />
      {items.map((it, i) => {
        const { lead, body } = splitLead(it);
        const last = i === items.length - 1;
        return (
          <li key={i} className="relative grid grid-cols-[15px_1fr] gap-5 pb-8 last:pb-0">
            <motion.span
              aria-hidden
              className={`relative z-10 mt-[7px] size-[15px] rounded-full border ${
                last ? "border-white bg-white" : "border-white/70 bg-black"
              }`}
              variants={{
                hidden: { scale: 0.5, opacity: 0 },
                shown: { scale: 1, opacity: 1, transition: { ...NODE.dot, delay: i * NODE.stagger } },
              }}
            />
            <motion.div
              variants={{
                hidden: { opacity: 0, y: NODE.offsetY },
                shown: { opacity: 1, y: 0, transition: { ...NODE.text, delay: i * NODE.stagger + 0.05 } },
              }}
            >
              <p className="text-xl font-light text-white md:text-2xl">
                <Rich rich={lead} strong="font-light" />
              </p>
              <p className="mt-1 max-w-[56ch] text-[15px] leading-[1.7] text-white/70 md:text-base">
                <Rich rich={body} />
              </p>
            </motion.div>
          </li>
        );
      })}
    </motion.ol>
  );
}
