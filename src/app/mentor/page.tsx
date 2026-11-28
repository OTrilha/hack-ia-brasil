import Link from "next/link";
import { GuideBlock, RoleGuide, StepList, roleGuideMetadata } from "@/components/guide/role-guide";
import { MentorSchedule } from "@/components/guide/mentor-schedule";

export const metadata = roleGuideMetadata(
  "Guia do mentor · Hack IA Brasil",
  "Horários das rodadas, perguntas para os times e referências para a mentoria.",
);

const steps = [
  {
    title: "Entenda onde o time travou",
    body: "Como nas mentorias do Trilha, ouça antes de sugerir. Se a dificuldade for definir o problema, peça um caso concreto. Quem passou por isso? O que aconteceu, o que causou o problema e qual foi a consequência?",
  },
  {
    title: "Olhem juntos para o que já existe",
    body: "Se a trava for técnica, peça para ver onde o fluxo falha e o que já tentaram. Se for falta de tempo, pergunte qual parte precisa funcionar para que alguém entenda a ideia na demo.",
  },
  {
    title: "Deixe o próximo teste com a equipe",
    body: "Pergunte qual teste o time quer fazer agora e como vai saber se deu certo. Anote o grupo, a dificuldade e o teste combinado no grupo dos mentores. Isso ajuda a próxima dupla a retomar a conversa.",
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
      title="Qual é a maior dificuldade de vocês agora?"
      lead="Comece cada visita com essa pergunta. Dê tempo para a equipe responder e peça que mostre o que já tentou. Use o que ouvir para ajudar o time a escolher o próximo passo."
      feature={
        <>
          <section aria-labelledby="dinamica-da-mentoria" className="mb-6">
            <h2 id="dinamica-da-mentoria" className="text-2xl font-light tracking-tight">Como funcionam as rodadas</h2>
            <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-white/80">
              <p>
                São duas rodadas fixas. De manhã, das <strong>10h30 às 11h20</strong>, vá com sua dupla às mesas indicadas na escala. Vocês têm dez minutos com cada equipe. Até cinco mesas recebem mentoria ao mesmo tempo.
              </p>
              <p>
                À tarde, das <strong>14h às 14h50</strong>, você continua com sua dupla e visita outros grupos. Cada equipe recebe duas duplas diferentes no dia. Quem foi atendido primeiro de manhã fica para o fim da tarde.
              </p>
              <p>
                <strong>Fora das rodadas, qualquer equipe pode chamar você</strong>, mesmo antes da primeira visita. Até as <strong>16h30</strong>, procure circular quando estiver disponível. Use dez minutos como referência para dar atenção a outras mesas e fazer suas pausas.
              </p>
            </div>
          </section>
          <MentorSchedule />
        </>
      }
    >
      <GuideBlock title="A conversa de 10 minutos">
        <StepList steps={steps} />
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
