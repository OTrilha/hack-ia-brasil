import Link from "next/link";
import type { ReactNode } from "react";
import type { Rich as RichT } from "@/guide/content";
import { SECTION_BY_NUM, clean } from "./data";

// Presentation only: bold runs, links from the source, and three things that
// are text in Notion but should be tappable on a phone: "seção N" cross-refs,
// the e-mail and the phone number. The characters on screen never change.
const AUTO = /(seção \d+)|([\w.+-]+@[\w-]+\.[\w.]+)|(\+\d{2} \d{8,9})/g;

const linkCls =
  "text-white underline decoration-white/30 underline-offset-[5px] transition-colors hover:decoration-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60 rounded-[2px]";

function autoLink(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(AUTO)) {
    const i = m.index!;
    if (i > last) out.push(text.slice(last, i));
    const [whole, ref, mail, phone] = m;
    if (ref) {
      const href = SECTION_BY_NUM[ref.split(" ")[1]];
      out.push(
        href ? (
          <Link key={`${key}-${i}`} href={href} className={linkCls}>
            {whole}
          </Link>
        ) : (
          whole
        ),
      );
    } else if (mail) {
      out.push(
        <a key={`${key}-${i}`} href={`mailto:${mail}`} className={linkCls}>
          {whole}
        </a>,
      );
    } else if (phone) {
      out.push(
        <a key={`${key}-${i}`} href={`tel:+55${phone.replace(/\D/g, "")}`} className={`${linkCls} whitespace-nowrap`}>
          {whole}
        </a>,
      );
    }
    last = i + whole.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Render one rich-text run list. `strong` styles the bold runs. */
export function Rich({
  rich,
  strong = "font-normal text-white",
  links = true,
}: {
  rich: RichT;
  strong?: string;
  links?: boolean;
}) {
  return (
    <>
      {clean(rich).map((s, i) => {
        const key = String(i);
        if (s.href) {
          const external = /^https?:/.test(s.href);
          return (
            <a
              key={key}
              href={s.href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className={`${linkCls} ${s.b ? "font-normal" : ""}`}
            >
              {s.t}
              {external && (
                <span aria-hidden className="ml-1 inline-block text-[0.8em] text-white/50">
                  ↗
                </span>
              )}
            </a>
          );
        }
        const body = links ? autoLink(s.t, key) : [s.t];
        return s.b ? (
          <strong key={key} className={strong}>
            {body}
          </strong>
        ) : (
          <span key={key}>{body}</span>
        );
      })}
    </>
  );
}
