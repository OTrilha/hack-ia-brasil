"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig, motion, useScroll, useSpring } from "motion/react";
import type { ReactNode } from "react";
import { ClickDots } from "@/components/fx/click-dots";
import { PAGES, PAGE_ORDER } from "./data";
import { GuideFooter } from "./footer";

const TAB = {
  spring: { type: "spring" as const, stiffness: 420, damping: 36 }, // active pill glide
};
const PROGRESS = {
  spring: { stiffness: 260, damping: 40, restDelta: 0.001 }, // reading hairline
};

const participantLinks = PAGE_ORDER.map((key) => PAGES[key]);
const staffLinks = [
  { href: "/guia", label: "Participante" },
  { href: "/mentor", label: "Mentor" },
  { href: "/jurados", label: "Jurados" },
];

function GuideHeader({ staff }: { staff: boolean }) {
  const path = usePathname();
  const links = staff
    ? staffLinks.filter(({ href }) => href === "/guia" || href === path)
    : participantLinks;
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, PROGRESS.spring);

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/75 backdrop-blur-md supports-[backdrop-filter]:bg-black/55">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-3 min-[360px]:px-4 md:px-10 lg:px-16">
        <Link
          href="/"
          className="hidden font-mono text-xs uppercase tracking-[0.28em] text-white/85 transition-colors hover:text-white sm:block"
        >
          Hack IA Brasil
        </Link>
        <nav aria-label={staff ? "Guias do evento" : "Guia do participante"} className="flex flex-1 sm:flex-none">
          <ul className="flex w-full items-center justify-between gap-0.5 sm:justify-end sm:gap-1">
            {links.map((p) => {
              const active = path === p.href;
              return (
                <li key={p.href}>
                  <Link
                    href={p.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative block whitespace-nowrap rounded-full px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-200 min-[360px]:px-4 min-[360px]:tracking-[0.22em] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 ${
                      active ? "text-[#000928]" : "text-white/70 hover:text-white"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="guide-tab"
                        className="absolute inset-0 rounded-full bg-white"
                        transition={TAB.spring}
                      />
                    )}
                    <span className="relative">{p.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
      <motion.div
        aria-hidden
        className="absolute inset-x-0 -bottom-px h-px origin-left bg-white/70"
        style={{ scaleX: progress }}
      />
    </header>
  );
}

export function GuideShell({ children, staff = false }: { children: ReactNode; staff?: boolean }) {
  return (
    // reducedMotion="user": with prefers-reduced-motion, motion drops transforms and keeps fades
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-black font-light text-white selection:bg-white selection:text-[#000928]">
        <ClickDots />
        <GuideHeader staff={staff} />
        <div className="relative z-10">{children}</div>
        <GuideFooter />
      </div>
    </MotionConfig>
  );
}
