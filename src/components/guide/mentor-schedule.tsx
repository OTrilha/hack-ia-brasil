"use client";

import { useState } from "react";
import { mentorPairs, rounds, type MentorPair } from "@/guide/mentoria";

const pairs = Object.keys(mentorPairs) as MentorPair[];
const slots = rounds.flatMap((round) => round.slots);
const formatTime = (time: string) => time.replace(":", "h");

export function MentorSchedule() {
  const [pair, setPair] = useState<MentorPair | "">("");
  const [slot, setSlot] = useState(slots[0]);

  const assignments = Object.entries(slot.groups) as [MentorPair, number][];
  assignments.sort(([, a], [, b]) => a - b);

  return (
    <section id="cronograma" aria-labelledby="titulo-cronograma" className="scroll-mt-20 rounded-2xl border border-white/15 bg-[#101011] p-4 sm:p-6">
      <h2 id="titulo-cronograma" className="text-2xl font-light tracking-tight">Escala de mentoria</h2>
      <label htmlFor="dupla" className="mt-4 block text-sm text-white/70">Consultar por dupla</label>
      <select id="dupla" value={pair} onChange={(event) => setPair(event.target.value as MentorPair | "")}
        className="mt-1 w-full max-md:min-h-12 pointer-coarse:min-h-12 rounded-lg border border-white/25 bg-[#171719] px-3 py-2 text-sm text-white scheme-dark focus-visible:outline-2 focus-visible:outline-offset-2">
        <option value="">Todas as duplas</option>
        {pairs.map((key) => <option key={key} value={key}>{mentorPairs[key]}</option>)}
      </select>

      <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
        {rounds.map(({ period, slots }) => (
          <div key={period} className="min-w-0 first:pr-2 last:pl-2 sm:first:pr-4 sm:last:pl-4">
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/65">{period}</h3>
            <ul>
              {slots.map((item) => {
                const time = <time dateTime={item.time} className="font-mono text-sm font-normal tabular-nums">{formatTime(item.time)}</time>;
                const group = pair && item.groups[pair];
                return (
                  <li key={item.time} className="border-b border-white/10 last:border-0">
                    {pair ? (
                      <div className="flex min-h-10 flex-wrap items-center justify-between gap-x-1 py-2">
                        {time}
                        <span className="text-xs text-white/75">{group ? `Grupo ${group}` : "Livre"}</span>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setSlot(item)} aria-pressed={slot === item}
                        aria-controls="mesas-do-horario"
                        className="flex min-h-10 w-full cursor-pointer flex-wrap items-center justify-between gap-x-1 rounded-md px-1.5 py-2 text-left text-white/80 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-1 aria-pressed:bg-white aria-pressed:text-black sm:px-2">
                        {time}
                        <span className="text-xs">{Object.keys(item.groups).length} mesas</span>
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {!pair && (
        <div id="mesas-do-horario" aria-live="polite" className="mt-4 border-t border-white/20 pt-4">
          <h3 className="text-lg font-medium">Mesas das {formatTime(slot.time)}</h3>
          <dl className="mt-2 divide-y divide-white/10 text-sm">
            {assignments.map(([key, group]) => (
              <div key={key} className="grid grid-cols-[5rem_1fr] gap-3 py-2">
                <dt className="text-white/70">Grupo {group}</dt>
                <dd>{mentorPairs[key]}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </section>
  );
}
