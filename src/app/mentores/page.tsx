import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatMentorEditionDate, getMentorEditionMapUrl } from "@/lib/mentor-invitation-copy";
import { getMentorContext, type MentorParticipation } from "@/lib/mentors";
import {
  MentorAccessForm,
  MentorPrintButton,
  MentorResponseForm,
  MentorSignOutButton,
} from "./portal-forms";
import { MentorProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: "Área de mentores | Hack IA Brasil",
  description: "Acesso de mentores convidados do Hack IA Brasil.",
  robots: { index: false, follow: false },
};

const responseLabel = {
  invited: "Aguardando resposta",
  confirmed: "Presença confirmada",
  declined: "Convite recusado",
} satisfies Record<MentorParticipation["response"], string>;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeZone: "America/Fortaleza",
});

const downloadClass =
  "inline-flex min-h-11 items-center rounded-lg border border-white/25 px-4 py-2.5 text-sm font-medium transition-colors hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

export default function MentorsPage() {
  return (
    <Suspense fallback={<p role="status" className="px-5 py-10 text-white/75">Carregando área de mentores…</p>}>
      <MentorPortal />
    </Suspense>
  );
}

async function MentorPortal() {
  await connection();
  const context = await getMentorContext();
  const entries = context.kind === "signed-in" ? context.participations.toSorted((a, b) => (
    Number(!b.verified_at && b.response === "invited") - Number(!a.verified_at && a.response === "invited")
  )) : [];

  return (
    <main className="min-h-dvh bg-black px-5 py-10 text-white sm:px-8 sm:py-16 print:min-h-0 print:bg-white print:p-0 print:text-black">
      <div className="mx-auto max-w-3xl">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/15 pb-5 sm:gap-5 sm:pb-9 print:border-black/25">
          <div className="min-w-0">
            <p className="mb-2 font-mono text-xs font-medium uppercase tracking-[0.26em] text-white/65 sm:mb-4 print:text-black">
              Hack IA Brasil
            </p>
            <h1 className="text-3xl font-light tracking-tight sm:text-5xl print:hidden">Área de mentores</h1>
            <h1 className="hidden text-3xl font-medium print:block">Registro de participação</h1>
          </div>
          {context.kind === "signed-in" && (
            <div className="flex flex-wrap gap-2 print:hidden">
              {context.isOrganizer && <Link href="/mentores/organizacao" className={downloadClass}>Painel da organização</Link>}
              <MentorSignOutButton />
            </div>
          )}
        </header>

        {context.kind === "signed-out" && (
          <section aria-labelledby="mentor-access-heading" className="mt-7 max-w-lg rounded-2xl border border-white/15 bg-white/[0.035] p-5 sm:mt-10 sm:p-7">
            <h2 id="mentor-access-heading" className="text-2xl font-medium">Entre na área de mentores</h2>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-white/70">
              O botão do e-mail de convite já entra direto. Sem ele, use o endereço em que recebeu o convite para receber um código.
            </p>
            <MentorAccessForm />
            <p className="mt-5 text-sm leading-relaxed text-white/65">
              Perdeu acesso a esse e-mail? Fale com a organização para atualizar seu cadastro.
            </p>
          </section>
        )}

        {context.kind === "unconfigured" && (
          <p className="mt-7 text-sm leading-relaxed text-white/75">
            A área de mentores ainda não está disponível. Em caso de dúvida, fale com a organização.
          </p>
        )}

        {context.kind === "error" && (
          <p role="alert" className="mt-7 text-sm leading-relaxed text-rose-200">
            Não conseguimos carregar a área de mentores. Atualize a página ou tente novamente em instantes.
          </p>
        )}

        {context.kind === "signed-in" && (
          <section aria-labelledby="mentor-editions-heading" className="mt-7 sm:mt-10 print:mt-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
              <h2 id="mentor-editions-heading" className="text-xl font-medium">Seus convites e comprovantes</h2>
              {entries.some((entry) => entry.verified_at) && <MentorPrintButton />}
            </div>
            {entries.length === 0 ? (
              <p className="text-sm leading-relaxed text-white/75">
                Nenhum convite está vinculado a este e-mail. Fale com a organização se recebeu um convite.
              </p>
            ) : (
              <div className="grid gap-4">
                {entries.map((entry) => <MentorEdition key={entry.id} entry={entry} />)}
              </div>
            )}
          </section>
        )}
        {context.kind === "signed-in" && (entries.length > 0 || context.profile) && (
          <MentorProfileForm profile={context.profile} invitedName={entries[0]?.name} />
        )}
      </div>
    </main>
  );
}

function MentorEdition({ entry }: { entry: MentorParticipation }) {
  const date = formatMentorEditionDate(entry.event?.event_date ?? null);
  const hours = entry.event?.hours;
  const venue = entry.event?.venue;
  const address = entry.event?.address;
  const mapUrl = getMentorEditionMapUrl(entry.event?.map_url ?? null);

  return (
    <article
      className={
        "grid gap-5 rounded-2xl border border-white/15 bg-white/[0.035] p-5 sm:p-7 " +
        (entry.verified_at ? "print:break-inside-avoid print:border-black/25 print:bg-white" : "print:hidden")
      }
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="break-words text-2xl font-medium">{entry.edition}</h3>
          <p className="mt-1 break-words text-sm text-white/75 print:text-black">{entry.full_name ?? entry.name} · {entry.role}</p>
        </div>
        <p role="status" className="rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white/85 print:border-black/25 print:text-black">
          {entry.verified_at ? "Atuação validada" : responseLabel[entry.response]}
        </p>
      </header>
      {(date || hours || venue || address || mapUrl) && (
        <dl className="grid gap-x-8 gap-y-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 text-sm sm:grid-cols-2 print:border-black/25 print:bg-white">
          {(date || hours) && (
            <div>
              <dt className="font-medium">Quando</dt>
              <dd className="mt-1 text-white/75 print:text-black">
                {date && <time dateTime={entry.event?.event_date ?? undefined}>{date}</time>}
                {date && hours && " · "}{hours}
              </dd>
            </div>
          )}
          {(venue || address || mapUrl) && (
            <div>
              <dt className="font-medium">Onde</dt>
              <dd className="mt-1 break-words text-white/75 print:text-black">
                {venue && <span className="block">{venue}</span>}
                {address && <span className="block">{address}</span>}
                {mapUrl && <a href={mapUrl} className="mt-0.5 inline-block underline underline-offset-4 print:hidden">Ver no mapa</a>}
              </dd>
            </div>
          )}
        </dl>
      )}
      {entry.verified_at ? (
        <>
          <div className="grid gap-3 border-t border-white/15 pt-5 print:border-black/25">
            <h4 className="font-medium">Atividades confirmadas</h4>
            {entry.activity && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80 print:text-black">{entry.activity}</p>}
            <p className="text-sm text-white/65 print:text-black">
              Validação da organização em{" "}
              <time dateTime={entry.verified_at}>{dateFormatter.format(new Date(entry.verified_at))}</time>.
            </p>
          </div>
          <div className="grid gap-3 print:hidden">
            <h4 className="font-medium">Declaração assinada</h4>
            {entry.has_pdf_pt || entry.has_pdf_en ? (
              <div className="flex flex-wrap gap-2">
                {entry.has_pdf_pt && (
                  <a className={downloadClass} href={`/mentores/comprovantes/${entry.id}/pt`} download>
                    Baixar PDF em português
                  </a>
                )}
                {entry.has_pdf_en && (
                  <a className={downloadClass} href={`/mentores/comprovantes/${entry.id}/en`} download lang="en">
                    Download PDF in English
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-white/75">O arquivo aparecerá aqui quando a organização publicar a declaração.</p>
            )}
          </div>
        </>
      ) : entry.response === "invited" ? (
        <>
          <p className="text-sm leading-relaxed text-white/80">No evento, você acompanha as equipes, ajuda nas decisões técnicas e dá feedback sobre os projetos.</p>
          <MentorResponseForm id={entry.id} availability={entry.availability} fullName={entry.full_name ?? entry.name} />
        </>
      ) : (
        <details className="print:hidden">
          <summary className="w-fit cursor-pointer text-sm underline underline-offset-4">Alterar resposta</summary>
          <div className="mt-4"><MentorResponseForm id={entry.id} availability={entry.availability} fullName={entry.full_name ?? entry.name} /></div>
        </details>
      )}
    </article>
  );
}
