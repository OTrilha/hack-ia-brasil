import Link from "next/link";
import { GuideBlock, RoleGuide, Roster, StepList, roleGuideMetadata } from "@/components/guide/role-guide";
import { mentors, rounds } from "@/guide/mentoria";

export const metadata = roleGuideMetadata(
  "Guia do mentor · Hack IA Brasil",
  "Horários das rodadas, perguntas para os times e referências para a mentoria.",
);

const steps = [
  {
    title: "Ouça o time",
    body: "Como nas mentorias do Trilha, comece com uma pergunta. Quem vive esse problema? Como vocês descobriram a causa?",
  },
  {
    title: "Peça para ver",
    body: "O que já funciona? O que vocês conseguem testar hoje? Deixe o time escolher o próximo passo.",
  },
  {
    title: "Anote e circule",
    body: "Envie o nome do grupo, o que ele testou e a dúvida que ficou no grupo dos mentores. Divida seu tempo entre as equipes.",
  },
];

const tracks = [
  { name: "Segurança", example: "A Minds Digital usa a voz para verificar a identidade de quem liga. Como distinguir uma tentativa de golpe de uma ligação legítima?" },
  { name: "Saúde", example: "A Laura alerta a equipe quando um paciente corre risco. Que informação ajudaria a equipe a agir a tempo?" },
  { name: "Educação", example: "A Letrus dá feedback de redação. O aluno consegue usar a sugestão para melhorar o próprio texto?" },
];

function Schedule() {
  const hasOpenGroups = rounds.some(({ slots }) =>
    slots.some(({ assignments, groups }) => (assignments?.length ?? 0) < groups),
  );

  return (
    <section id="cronograma" aria-labelledby="titulo-cronograma" className="scroll-mt-20 rounded-2xl border border-white/15 bg-[#101011]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pt-5 sm:px-6 sm:pt-6">
        <h2 id="titulo-cronograma" className="text-2xl font-light tracking-tight">Cronograma</h2>
        <span className="font-mono text-xs text-white/65">10 min por grupo</span>
      </div>
      <div className="grid grid-cols-2 divide-x divide-white/10 px-4 py-5 sm:px-6 sm:py-6">
        {rounds.map(({ period, slots }) => (
          <div key={period} className="min-w-0 first:pr-3 last:pl-3 sm:first:pr-5 sm:last:pl-5">
            <h3 className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">{period}</h3>
            <ul className="divide-y divide-white/[0.09]">
              {slots.map(({ time, groups, assignments }) => (
                <li key={time} className="py-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-1">
                    <time dateTime={time} className="font-mono text-base font-normal tabular-nums tracking-tight text-white sm:text-lg">{time.replace(":", "h")}</time>
                    <span className="text-xs text-white/65">{groups} grupos</span>
                  </div>
                  {assignments && assignments.length > 0 && (
                    <details className="mt-2 text-xs text-white/75">
                      <summary className="cursor-pointer py-1 underline underline-offset-4">Ver escala</summary>
                      <dl className="grid gap-2 py-2">
                        {assignments.map(({ group, mentors }) => (
                          <div key={group}>
                            <dt className="font-medium text-white">{group}</dt>
                            <dd>{mentors.join(", ")}</dd>
                          </div>
                        ))}
                      </dl>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-sm leading-relaxed text-white/70 sm:px-6">
        <p>À tarde, os grupos passam na ordem inversa e encontram outros mentores.</p>
        {hasOpenGroups && <p className="mt-1 text-white/60">A organização ainda está preenchendo a escala por horário.</p>}
      </div>
    </section>
  );
}

export default function MentorPage() {
  return (
    <RoleGuide
      role="mentor"
      title="Como conduzir a mentoria"
      lead="Ajude cada time a explicar a ideia, testar o que construiu e decidir o que ainda cabe no dia."
      feature={<Schedule />}
    >
      <GuideBlock title="A conversa de 10 minutos">
        <StepList steps={steps} />
        <p className="mt-5 text-sm leading-relaxed text-white/70">
          As equipes podem procurar você antes da primeira rodada e até <strong className="font-medium text-white">16h30</strong>.
          Fora da escala, use os mesmos dez minutos como referência e faça suas pausas.
        </p>
      </GuideBlock>
      <GuideBlock title="Fellowship e tracks">
        <p className="max-w-[65ch] text-base leading-relaxed text-white/75">
          A IA Brasil Fellowship é um programa de um ano para jovens com talento técnico. Estas são referências para conversar sobre as três tracks do hack.
        </p>
        <dl className="my-4 divide-y divide-white/10 border-y border-white/10">
          {tracks.map(({ name, example }) => (
            <div key={name} className="grid gap-1 py-3 sm:grid-cols-[6rem_1fr] sm:gap-4">
              <dt className="font-medium text-white">{name}</dt>
              <dd className="max-w-[65ch] text-sm leading-relaxed text-white/70">{example}</dd>
            </div>
          ))}
        </dl>
        <Link href="/guia/ideia#tracks" className="inline-flex min-h-10 items-center text-sm text-white/85 underline decoration-white/35 underline-offset-4 hover:decoration-white focus-visible:outline-white">
          Ver as tracks no guia do participante
        </Link>
      </GuideBlock>
      <GuideBlock title="Mentores">
        <Roster names={mentors} />
      </GuideBlock>
    </RoleGuide>
  );
}
