import Link from "next/link";
import { GuideBlock, RoleGuide, roleGuideMetadata } from "@/components/guide/role-guide";
import { MentorSchedule } from "@/components/guide/mentor-schedule";

export const metadata = roleGuideMetadata(
  "Guia do mentor · Hack IA Brasil",
  "Horários das rodadas, perguntas para os times e referências para a mentoria.",
);

const situations = [
  {
    title: "Quando o time explica a solução, mas a dor ainda está vaga",
    body: "Se alguém disser “queremos criar um tutor com IA”, peça uma cena: “Me conta de um aluno que precisaria disso. Em que momento ele travou? O que aconteceu depois?” A partir do exemplo, ajude o time a distinguir o problema, a causa e a consequência.",
  },
  {
    title: "Quando o time está dividido entre duas ideias",
    body: "Dê espaço para os dois lados. “O que fez vocês considerarem cada caminho? O que precisaríamos saber para escolher entre eles?” Às vezes, a melhor ajuda é o time perceber que a discordância inteira gira em torno de uma dúvida que dá para investigar hoje.",
  },
  {
    title: "Quando o time quer construir mais do que cabe no dia",
    body: "Peça que imaginem a cena principal da demo: “Alguém abre o produto, faz o quê e sai com qual resultado?” Com essa cena em mente, deixe a equipe decidir o que precisa funcionar até o pitch e o que pode esperar.",
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
        <p className="mb-5 text-base leading-relaxed text-white/80">
          Depois de ouvir a maior dificuldade do time, escolha uma destas conversas para a mesa.
        </p>
        <ul className="grid gap-5">
          {situations.map(({ title, body }) => (
            <li key={title}>
              <h3 className="text-lg font-medium leading-snug">{title}</h3>
              <p className="mt-1 max-w-prose text-[15px] leading-relaxed text-white/70">{body}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm leading-relaxed text-white/70">
          Ao sair, compartilhe o número da mesa, a dificuldade e o próximo passo no grupo dos mentores.
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
