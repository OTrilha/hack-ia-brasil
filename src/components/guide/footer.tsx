"use client";

import { motion } from "motion/react";
import { EVENT } from "@/content";
import { Scramble } from "@/components/fx/scramble";

/* ─────────────────────────────────────────────────────────
 * ANIMATION STORYBOARD (footer scrolls into view)
 *
 *    0ms   hairline draws out from the centre (scaleX 0 → 1)
 *  120ms   "powered by" decodes (Scramble), Cognition lockup rises
 *  280ms   partner rows rise, staggered 80ms
 *  520ms   event line decodes in spaced mono
 * ───────────────────────────────────────────────────────── */

const EASE = [0.23, 1, 0.32, 1] as const;
const TIMING = {
  line: 0, // ms
  lockup: 120,
  rows: 280,
  rowStagger: 80,
  stamp: 520,
};
const RISE = { offsetY: 10, duration: 0.6 };

// The closing line of the Notion deck, in parts so a phone wraps it between them.
const STAMP = ["Hack IA Brasil", "João Pessoa", "28.11.2026"];

// Medway has no logo in the repo: its name is set in type, like the others.
// Links to Medway João Pessoa on Instagram (asked by the organizers).
const MEDWAY_URL = "https://www.instagram.com/medwaypb/";

const s = (ms: number) => ms / 1000;
const rise = (ms: number) => ({
  hidden: { opacity: 0, y: RISE.offsetY },
  shown: { opacity: 1, y: 0, transition: { duration: RISE.duration, ease: EASE, delay: s(ms) } },
});

/** Mark tinted with the text colour through a CSS mask (same device as the home's PartnerLogo). */
function Mark({ src, w, h }: { src: string; w: number; h: number }) {
  return (
    <span
      aria-hidden
      className="block shrink-0 bg-current"
      style={{ width: w, height: h, WebkitMask: `url(${src}) center/contain no-repeat`, mask: `url(${src}) center/contain no-repeat` }}
    />
  );
}

const nameLink =
  "inline-flex items-center gap-2 text-white/85 underline decoration-white/20 underline-offset-[6px] transition-[color,text-decoration-color] duration-200 hover:text-white hover:decoration-white/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded-[2px]";

/** Closes every guide page: who makes the event happen. */
export function GuideFooter() {
  const rows = [
    {
      label: "co-organizado por",
      names: [
        <a key="iab" href={EVENT.fellowshipUrl} target="_blank" rel="noreferrer" className={nameLink}>
          IA Brasil Fellowship
        </a>,
        <a key="trilha" href={EVENT.trilhaUrl} target="_blank" rel="noreferrer" className={nameLink}>
          <Mark src="/montanha.svg" w={20} h={14} />
          Trilha
        </a>,
      ],
    },
    {
      label: "apoio e local",
      names: [
        <a key="medway" href={MEDWAY_URL} target="_blank" rel="noreferrer" className={nameLink}>
          Medway
        </a>,
      ],
    },
  ];

  return (
    <motion.footer
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-10% 0px" }}
      className="relative z-10 mx-auto max-w-6xl px-5 pb-28 text-center md:px-10 md:pb-24 lg:px-16"
    >
      {/* Full content width, like the home's footer rule: on /ideia and /dia a
          short centred line half-lined-up with the content column read as an accident. */}
      <motion.span
        aria-hidden
        className="block h-px w-full origin-center bg-white/[0.08]"
        variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1, transition: { duration: 0.7, ease: EASE, delay: s(TIMING.line) } } }}
      />

      <motion.div variants={rise(TIMING.lockup)} className="mt-14 md:mt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-white/55">
          <Scramble text="powered by" />
        </p>
        <a
          href={EVENT.cognitionUrl}
          target="_blank"
          rel="noreferrer"
          className="group mx-auto mt-5 inline-flex items-center gap-3.5 text-white transition-opacity duration-200 hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 md:gap-5"
        >
          <span className="transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rotate-[30deg]">
            <Mark src="/cognition.svg" w={28} h={28} />
          </span>
          {/* the sponsor leads the footer but stays under the page's own h1 */}
          <span className="text-[2rem] font-extralight leading-none tracking-[-0.01em] md:text-[2.75rem]">Cognition</span>
        </a>
      </motion.div>

      <dl className="mx-auto mt-12 grid max-w-lg gap-6 md:mt-14">
        {rows.map((r, i) => (
          <motion.div key={r.label} variants={rise(TIMING.rows + i * TIMING.rowStagger)} className="grid gap-2.5">
            <dt className="font-mono text-[11px] uppercase tracking-[0.3em] text-white/45">{r.label}</dt>
            <dd className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[17px] font-light md:text-lg">
              {r.names.map((n, j) => (
                <span key={j} className="inline-flex items-center gap-3">
                  {j > 0 && (
                    <span aria-hidden className="text-white/30">
                      ·
                    </span>
                  )}
                  {n}
                </span>
              ))}
            </dd>
          </motion.div>
        ))}
      </dl>

      <motion.p
        variants={rise(TIMING.stamp)}
        className="mt-14 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 min-[400px]:tracking-[0.3em] md:mt-16 md:text-[11px] md:tracking-[0.45em]"
      >
        {STAMP.map((part, i) => (
          <span key={part}>
            {i > 0 && " · "}
            <span className="whitespace-nowrap">
              <Scramble text={part} />
            </span>
          </span>
        ))}
      </motion.p>
    </motion.footer>
  );
}
