import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { formatMentorEditionDate, getMentorEditionMapUrl } from "@/lib/mentor-invitation-copy";
import { getOrganizerContext, type MentorEdition, type MentorInvite } from "@/lib/mentor-organizers";
import { MentorAccessForm, MentorSignOutButton } from "../portal-forms";
import { CertificateUploadForm } from "./certificate-upload-form";
import { DraftForm, EditDraftDialog, EditionForm, ParticipationForm, ReviewInvitation } from "./invitation-forms";

export const metadata: Metadata = {
  title: "Organização de mentores | Hack IA Brasil",
  robots: { index: false, follow: false },
};

const panelClass = "min-w-0 rounded-2xl border border-white/15 bg-white/[0.035] p-4 sm:p-6";
const disclosureClass =
  "w-fit cursor-pointer rounded-md text-sm font-medium text-white underline decoration-white/35 underline-offset-4 hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

const inviteStatuses = {
  draft: { label: "Rascunho", color: "border-white/20 bg-white/[0.06] text-white/80" },
  pending: { label: "Envio pendente", color: "border-amber-300/25 bg-amber-300/10 text-amber-100" },
  failed: { label: "Falha no envio", color: "border-rose-300/25 bg-rose-300/10 text-rose-100" },
  invited: { label: "Aguardando resposta", color: "border-sky-300/25 bg-sky-300/10 text-sky-100" },
  confirmed: { label: "Presença confirmada", color: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" },
  declined: { label: "Convite recusado", color: "border-white/20 bg-white/[0.06] text-white/80" },
  verified: { label: "Atuação validada", color: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100" },
};

const sendDate = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Fortaleza",
});

function getInviteStatus(invite: MentorInvite) {
  if (invite.verified_at) return inviteStatuses.verified;
  if (invite.response !== "invited") return inviteStatuses[invite.response];
  if (invite.delivery_failed_at && invite.sent_attempt < invite.invite_attempt) return inviteStatuses.failed;
  if (invite.invitation_drafted && !invite.invitation_attempt_started_at) return inviteStatuses.draft;
  if (invite.sent_attempt < invite.invite_attempt) return inviteStatuses.pending;
  return inviteStatuses.invited;
}

export default function MentorOrganizationPage() {
  return (
    <Suspense fallback={<p role="status" className="px-5 py-10 text-white/75">Carregando painel da organização…</p>}>
      <MentorOrganization />
    </Suspense>
  );
}

async function MentorOrganization() {
  await connection();
  const context = await getOrganizerContext();

  if (context.kind === "signed-out" || context.kind === "forbidden") {
    return <OrganizerEntry forbidden={context.kind === "forbidden"} />;
  }

  return (
    <main className="min-h-dvh bg-black px-4 py-6 text-white sm:px-8 sm:py-9">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:gap-5">
        <header className="flex items-center justify-between gap-3 pb-1 sm:pb-2">
          <div className="min-w-0">
            <Link href="/mentores" className="mb-1.5 inline-block rounded-sm text-xs font-medium text-white/65 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              Área de mentores
            </Link>
            <h1 className="text-2xl leading-tight font-medium tracking-tight sm:text-3xl">Organização de mentores</h1>
          </div>
          {context.kind === "signed-in" && <MentorSignOutButton destination="/mentores/organizacao" />}
        </header>

        {context.kind === "unconfigured" && (
          <p className="text-sm text-white/75">O painel da organização ainda está indisponível.</p>
        )}

        {context.kind === "error" && (
          <p role="alert" className="text-sm text-rose-200">O painel não pôde ser carregado. Atualize a página ou tente novamente em instantes.</p>
        )}

        {context.kind === "signed-in" && (
          <>
            <EditionHeader edition={context.edition} />
            <section className={panelClass} aria-labelledby="mentor-roster-heading">
              <div className="relative sm:min-h-11">
                <div className="grid min-w-0 gap-2 sm:pr-44">
                  <h2 id="mentor-roster-heading" className="text-xl font-medium">Mentores</h2>
                  <RosterSummary invites={context.invites} />
                </div>
                <details className="mt-3 min-w-0 sm:mt-0">
                  <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center rounded-lg bg-white px-4 text-sm font-semibold text-black hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:absolute sm:top-0 sm:right-0 [&::-webkit-details-marker]:hidden">
                    Adicionar mentor
                  </summary>
                  <div className="mt-4 rounded-lg border border-white/15 px-4 pb-4">
                    <DraftForm />
                  </div>
                </details>
              </div>

              {context.invites.length === 0 ? (
                <p className="mt-4 border-t border-white/15 pt-4 text-sm text-white/70">Nenhum mentor cadastrado.</p>
              ) : (
                <ul className="mt-4 divide-y divide-white/15 border-t border-white/15">
                  {context.invites.map((invite) => (
                    <InvitationRow
                      key={invite.id}
                      invite={invite}
                      edition={context.edition}
                      mailReady={context.mailReady}
                      portalUrl={context.portalUrl ?? "/mentores"}
                    />
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function OrganizerEntry({ forbidden }: { forbidden: boolean }) {
  const linkClass = "rounded-sm text-sm text-white/70 underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";

  return (
    <main className="bg-black text-white">
      <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-5 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-white/15 py-5 sm:py-7">
          <Link href="/" className={`${linkClass} font-mono text-[11px] font-medium tracking-[0.14em] text-white`}>HACK IA BRASIL</Link>
          <Link href="/mentores" className={linkClass}>Área de mentores <span aria-hidden="true">→</span></Link>
        </header>

        <div className="mx-auto grid w-full max-w-lg flex-1 content-center gap-8 py-10 sm:py-16 md:max-w-none md:grid-cols-2 md:items-center md:gap-12 lg:gap-20">
          <div className="min-w-0">
            <h1 className="text-4xl leading-[0.98] font-light tracking-tight text-balance sm:text-5xl lg:text-6xl">Painel da organização</h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70 sm:text-base">
              Envie convites e acompanhe as confirmações dos mentores.
            </p>
            <Image
              src="/mentor-invitation-globe.png"
              width={420}
              height={420}
              sizes="(min-width: 1024px) 288px, 224px"
              className="mt-6 hidden h-auto w-56 opacity-80 md:block lg:w-72"
              alt=""
            />
          </div>

          <div className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.045] p-5 sm:p-8">
            <div className="grid gap-3">
              <h2 className="text-2xl font-medium">{forbidden ? "Esta conta não tem acesso" : "Entre no painel"}</h2>
              <p className="mb-2 text-sm leading-relaxed text-white/70">
                {forbidden
                  ? "O painel é restrito à organização. Entre com o e-mail autorizado."
                  : "Use o e-mail autorizado para receber um código. Este aparelho fica conectado por 30 dias."}
              </p>
              {forbidden
                ? <MentorSignOutButton destination="/mentores/organizacao" label="Trocar de conta" />
                : <MentorAccessForm destination="/mentores/organizacao" />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function EditionHeader({ edition }: { edition: MentorEdition }) {
  const schedule = [formatMentorEditionDate(edition.event_date), edition.hours].filter(Boolean).join(" · ");
  const location = [edition.venue, edition.address].filter(Boolean).join(" · ");
  const mapUrl = getMentorEditionMapUrl(edition.map_url);

  return (
    <section aria-labelledby="mentor-edition-heading" className="relative min-w-0 rounded-xl border border-white/15 bg-white/[0.045] p-4 sm:px-6">
      <div className="grid min-w-0 gap-1.5 sm:pr-28">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 id="mentor-edition-heading" className="text-base font-semibold break-words">{edition.name}</h2>
          <p className="text-sm text-white/75">{schedule || "Data e horário a definir."}</p>
        </div>
        {(location || mapUrl) && (
          <p className="text-sm break-words text-white/65">
            {location}
            {mapUrl && (
              <span className="whitespace-nowrap">
                {location && " · "}
                <a className="rounded-sm text-white/80 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href={mapUrl} target="_blank" rel="noreferrer">Ver no mapa</a>
              </span>
            )}
          </p>
        )}
      </div>
      <details className="mt-2 min-w-0 sm:mt-0">
        <summary className="flex min-h-9 w-fit cursor-pointer list-none items-center rounded-md text-sm text-white/65 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:absolute sm:top-3 sm:right-6 [&::-webkit-details-marker]:hidden">
          Editar dados
        </summary>
        <div className="mt-3 border-t border-white/15 pt-1">
          <EditionForm edition={edition} />
        </div>
      </details>
    </section>
  );
}

function RosterSummary({ invites }: { invites: MentorInvite[] }) {
  const counts = new Map<string, number>();
  for (const invite of invites) {
    const { label } = getInviteStatus(invite);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  if (counts.size === 0) return null;

  return (
    <ul aria-label="Resumo dos convites" className="flex flex-wrap gap-x-3 gap-y-1 text-xs tabular-nums text-white/70">
      {Object.values(inviteStatuses).map(({ label }) => {
        const count = counts.get(label);
        return count ? <li key={label}>{label} <strong className="ml-1 text-white">{count}</strong></li> : null;
      })}
    </ul>
  );
}

function InvitationRow({ invite, edition, mailReady, portalUrl }: {
  invite: MentorInvite;
  edition: MentorEdition;
  mailReady: boolean;
  portalUrl: string;
}) {
  const status = getInviteStatus(invite);
  const canSend = invite.response === "invited" && !invite.verified_at;
  const canEdit = invite.invitation_drafted && !invite.invitation_attempt_started_at;
  const sendLabel = invite.sent_attempt === invite.invite_attempt ? "Reenviar convite" :
    invite.invitation_attempt_started_at ? "Tentar envio novamente" : "Revisar e enviar convite";

  return (
    <li className="grid min-w-0 grid-cols-1 gap-3 py-4 last:pb-0">
      <div className="grid min-w-0 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)]">
        <div className="min-w-0">
          <p className="break-words font-medium">{invite.name}</p>
          <p className="mt-1 break-words text-sm text-white/75">{invite.email}</p>
          {invite.full_name && invite.full_name !== invite.name && (
            <p className="mt-1 break-words text-sm text-white/65">Nome na declaração: {invite.full_name}</p>
          )}
        </div>
        <div className="grid content-start justify-items-start gap-1.5 sm:justify-items-end">
          <p className={`w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</p>
          {invite.invitation_sent_at && (
            <p className="text-xs text-white/65">
              Envio em <time dateTime={invite.invitation_sent_at}>{sendDate.format(new Date(invite.invitation_sent_at))}</time>
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap items-start gap-x-4 gap-y-2">
        {canSend && (
          <ReviewInvitation
            invite={invite}
            edition={edition}
            mailReady={mailReady}
            ready={Boolean(edition.event_date && edition.hours && edition.venue && edition.address)}
            portalUrl={portalUrl}
            label={sendLabel}
          />
        )}
        {canEdit && <EditDraftDialog invite={invite} />}
        {!invite.invitation_drafted && (
          <details className="min-w-0 self-center open:w-full open:rounded-lg open:border open:border-white/15 open:bg-white/[0.025] open:p-4">
            <summary className={disclosureClass}>{invite.verified_at ? "Atuação e declarações" : "Registrar atuação"}</summary>
            <div className="mt-4 grid min-w-0 gap-5">
              <ParticipationForm invite={invite} />
              {invite.verified_at && (
                <CertificateUploadForm id={invite.id} hasPdfPt={invite.has_pdf_pt} hasPdfEn={invite.has_pdf_en} />
              )}
            </div>
          </details>
        )}
      </div>
    </li>
  );
}
