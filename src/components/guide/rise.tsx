"use client";

import { motion } from "motion/react";
import { createContext, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import css from "./first-screen.module.css";

// Same entrance as fx/Reveal, but renders the element itself, so list rows
// stay valid HTML (ul > li, dl > div) instead of gaining a wrapper div.
// Inside <FirstScreen> it swaps to a CSS entrance: whileInView only runs
// after hydration, and the first screen must never be blank on a slow phone.
const RISE = {
  offsetY: 12, // px
  blur: 6, // px
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as const,
};

const FIRST = {
  done: 1600, // ms; after this the CSS entrance never replays (Activity)
};

const FirstCtx = createContext(false);
export const useFirstScreen = () => useContext(FirstCtx);

/** Delay (ms) for a CSS entrance inside <FirstScreen>, as a style object. */
export const enterDelay = (ms: number) => ({ "--d": `${Math.round(ms)}ms` }) as CSSProperties;

/**
 * Wrap what lands on the first screen under the hero. Its <Rise> children
 * animate with CSS from the first paint (starting just after the hero, see
 * first-screen.module.css) instead of waiting for JS.
 */
export function FirstScreen({ children }: { children: ReactNode }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), FIRST.done);
    return () => clearTimeout(t);
  }, []);
  return (
    <FirstCtx.Provider value>
      <div className={`min-w-0 ${css.first} ${done ? css.done : ""}`}>{children}</div>
    </FirstCtx.Provider>
  );
}

export function Rise({
  as = "div",
  children,
  className = "",
  delay = 0,
  y = RISE.offsetY,
}: {
  as?: "div" | "li";
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const first = useFirstScreen();
  if (first) {
    const Tag = as;
    return (
      <Tag data-enter className={className} style={enterDelay(delay * 1000)}>
        {children}
      </Tag>
    );
  }
  const C = as === "li" ? motion.li : motion.div;
  return (
    <C
      className={className}
      initial={{ opacity: 0, y, filter: `blur(${RISE.blur}px)` }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: RISE.duration, delay, ease: RISE.ease }}
    >
      {children}
    </C>
  );
}
