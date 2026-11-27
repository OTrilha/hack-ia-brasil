import Link from "next/link";
import { GuideBlock, RoleGuide, StepList, roleGuideMetadata } from "@/components/guide/role-guide";
import { MentorSchedule } from "@/components/guide/mentor-schedule";

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

export default function MentorPage() {
  return (
    <RoleGuide
      role="mentor"
      title="Como conduzir a mentoria"
      lead="Até cinco mesas recebem mentoria ao mesmo tempo, com uma dupla por mesa. Cada grupo tem 10 minutos de manhã e mais 10 com outra dupla à tarde."
      feature={<MentorSchedule />}
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
    </RoleGuide>
  );
}
