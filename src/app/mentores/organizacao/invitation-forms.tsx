"use client";

import { startTransition, useActionState, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { isMentorRole, MENTOR_ROLES, mentorAccessUrl, mentorInvitationCopy } from "@/lib/mentor-invitation-copy";
import type { MentorEdition, MentorInvite } from "@/lib/mentor-organizers";
import type { FormFeedback } from "../actions";
import { saveDraft, saveEdition, sendInvitation, verifyParticipation } from "./actions";

const initialFeedback: FormFeedback = { kind: "idle" };
const inputClass =
  "min-w-0 w-full rounded-lg border border-white/20 bg-black px-3.5 py-2.5 text-base text-white placeholder:text-white/45 focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70";
const primaryButtonClass =
  "w-fit rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/85 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-55";
const secondaryButtonClass =
  "w-fit rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white/85 hover:border-white/40 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-55";

export function EditionForm({ edition }: { edition: MentorEdition }) {
  const [fields, setFields] = useState({
    event_date: edition.event_date ?? "",
    hours: edition.hours ?? "",
    venue: edition.venue ?? "",
    address: edition.address ?? "",
    map_url: edition.map_url ?? "",
  });
  const [state, submit, pending] = useActionState(saveEdition, initialFeedback);
  const editionFields = [
    { name: "event_date", label: "Data", type: "date", maxLength: undefined },
    { name: "hours", label: "Horário", type: "text", maxLength: 120 },
    { name: "venue", label: "Local", type: "text", maxLength: 180 },
    { name: "address", label: "Endereço", type: "text", maxLength: 350 },
    { name: "map_url", label: "Link do mapa", type: "url", maxLength: 1500 },
  ] as const;

  return (
    <form action={submit} className="mt-4 grid gap-4">
      <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        {editionFields.map(({ name: field, label, type, maxLength }) => (
          <label key={field} className="grid min-w-0 gap-1.5 text-sm">
            {label}
            <input
              className={inputClass}
              name={field}
              type={type}
              maxLength={maxLength}
              required={field !== "map_url"}
              value={fields[field]}
              onChange={(event) => setFields({ ...fields, [field]: event.target.value })}
            />
          </label>
        ))}
      </fieldset>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className={primaryButtonClass} disabled={pending}>
          {pending ? "Salvando…" : "Salvar dados do evento"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DraftForm({ invite, onSaved, onCancel }: {
  invite?: MentorInvite;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(invite?.name ?? "");
  const [email, setEmail] = useState(invite?.email ?? "");
  const [state, submit, pending] = useActionState(
    async (previous: FormFeedback, data: FormData) => {
      const result = await saveDraft(invite?.id ?? null, previous, data);
      if (result.kind === "success") {
        if (!invite) {
          setName("");
          setEmail("");
        }
        onSaved?.();
      }
      return result;
    },
    initialFeedback,
  );

  return (
    <form action={submit} className={invite ? "grid gap-5" : "mt-4 grid gap-4"}>
      {invite && <input type="hidden" name="invitation_revision" value={invite.invitation_revision} />}
      <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className="grid min-w-0 gap-1.5 text-sm">
          Nome da pessoa convidada
          <input className={inputClass} name="name" value={name} maxLength={200} autoComplete="off" required onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="grid min-w-0 gap-1.5 text-sm">
          E-mail da pessoa convidada
          <input className={inputClass} name="email" type="email" value={email} maxLength={254} autoCapitalize="none" required onChange={(event) => setEmail(event.target.value)} />
        </label>
      </fieldset>
      <Feedback state={state} />
      <div className={`flex flex-wrap items-center gap-3 ${onCancel ? "justify-end border-t border-white/15 pt-4" : ""}`}>
        {onCancel && <button type="button" className={secondaryButtonClass} disabled={pending} onClick={onCancel}>Cancelar</button>}
        <button type="submit" disabled={pending || !name.trim() || !email.trim()} className={primaryButtonClass}>
          {pending ? "Salvando…" : invite ? "Salvar alterações" : "Salvar rascunho"}
        </button>
      </div>
    </form>
  );
}

type ReviewInvitationProps = {
  invite: MentorInvite;
  edition: MentorEdition;
  mailReady: boolean;
  portalUrl: string;
  label: string;
  ready: boolean;
};

function InvitationDialog({ label, primary, children }: {
  label: string;
  primary?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const headingId = useId();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) dialog.current?.close();
  }, [open]);

  function close() {
    setOpen(false);
  }

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        className={primary ? primaryButtonClass : secondaryButtonClass}
        onClick={() => {
          dialog.current?.showModal();
          setOpen(true);
        }}
      >
        {label}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby={headingId}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-xl border border-white/20 bg-[#101114] p-0 text-white shadow-2xl backdrop:bg-black/75 open:flex"
        onClose={() => {
          setOpen(false);
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/15 p-4 sm:px-6">
          <h3 id={headingId} className="text-lg font-semibold leading-tight">{label}</h3>
          <button type="button" aria-label="Fechar janela" className="shrink-0 rounded-md px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white" onClick={close}>Fechar</button>
        </header>
        {open && children(close)}
      </dialog>
    </>
  );
}

export function EditDraftDialog({ invite }: { invite: MentorInvite }) {
  return (
    <InvitationDialog label="Editar rascunho">
      {(close) => (
        <div className="min-h-0 overflow-y-auto p-4 sm:px-6">
          <DraftForm invite={invite} onSaved={close} onCancel={close} />
        </div>
      )}
    </InvitationDialog>
  );
}

export function ReviewInvitation(props: ReviewInvitationProps) {
  return (
    <InvitationDialog label={props.label} primary={props.invite.invitation_drafted}>
      {(close) => <ReviewInvitationForm {...props} close={close} />}
    </InvitationDialog>
  );
}

function ReviewInvitationForm({ invite, edition, mailReady, portalUrl, ready, close }: ReviewInvitationProps & {
  close: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);
  const [state, submit, pending] = useActionState(
    async (previous: FormFeedback, data: FormData) => {
      const result = await sendInvitation(invite.id, invite.invite_attempt, invite.invitation_revision, previous, data);
      if (result.kind === "success") close();
      return result;
    },
    initialFeedback,
  );
  const copy = mentorInvitationCopy({ name: invite.name, edition, portalUrl, accessUrl: mentorAccessUrl(portalUrl) });

  return (
    <form action={submit} className="flex min-h-0 min-w-0 flex-col">
      <input type="hidden" name="edition_snapshot" value={JSON.stringify(edition)} />
      <input type="hidden" name="sent_attempt" value={invite.sent_attempt} />
      <div className="grid min-h-0 min-w-0 gap-4 overflow-y-auto overscroll-contain p-4 sm:px-6">
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 rounded-lg border border-white/15 bg-black/30 p-3 text-sm sm:p-4">
          <dt className="text-white/65">Para</dt>
          <dd className="break-words">{invite.name} · {invite.email}</dd>
          <dt className="text-white/65">Assunto</dt>
          <dd className="break-words">{copy.subject}</dd>
        </dl>
        <div className="min-w-0">
          <button type="button" aria-expanded={showPreview} className={secondaryButtonClass} onClick={() => setShowPreview(!showPreview)}>
            {showPreview ? "Ocultar prévia" : "Prévia do e-mail"}
          </button>
          {showPreview && (
            <>
              <iframe
                srcDoc={copy.html}
                title={`Prévia do convite para ${invite.name}`}
                sandbox=""
                tabIndex={-1}
                aria-hidden="true"
                className="pointer-events-none mt-3 block h-[50rem] w-full rounded-lg border border-white/15 bg-[#080a0e]"
              />
              <p className="sr-only">{copy.text}</p>
            </>
          )}
        </div>
      </div>
      <footer className="grid shrink-0 gap-3 border-t border-white/15 p-4 sm:px-6">
        {!ready && <p role="status" className="text-sm text-amber-200">Preencha a data, o horário, o local e o endereço da edição para enviar.</p>}
        {!mailReady && <p role="status" className="text-sm text-amber-200">O envio ficará disponível após a configuração do e-mail da organização.</p>}
        <Feedback state={state} />
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button type="button" className={secondaryButtonClass} disabled={pending} onClick={close}>Cancelar</button>
          <button type="submit" disabled={!ready || !mailReady || pending} className={primaryButtonClass}>
            {pending ? "Enviando…" : "Confirmar envio"}
          </button>
        </div>
      </footer>
    </form>
  );
}

export function ParticipationForm({ invite }: { invite: MentorInvite }) {
  const [activity, setActivity] = useState(invite.activity ?? "");
  const [role, setRole] = useState(invite.role);
  const [state, submit, pending] = useActionState(
    verifyParticipation.bind(null, invite.id), initialFeedback,
  );

  return (
    // onSubmit skips React's post-action form reset, which would drop the controlled <select> back to its first option.
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(() => submit(data));
      }}
    >
      <label className="grid gap-1.5 text-sm">
        Papel exercido
        <select
          name="role"
          required
          className={inputClass + " w-fit max-w-full"}
          value={role}
          onChange={({ target: { value } }) => isMentorRole(value) && setRole(value)}
        >
          {Object.keys(MENTOR_ROLES).map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        Atividades realizadas
        <textarea
          className={inputClass}
          name="activity"
          rows={3}
          maxLength={2000}
          required
          value={activity}
          placeholder="Descreva as sessões, o papel do mentor e a duração registrada."
          onChange={(event) => setActivity(event.target.value)}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending || !activity.trim()} className={primaryButtonClass}>
          {pending ? "Salvando…" : invite.verified_at ? "Atualizar registro" : "Validar atuação"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

function Feedback({ state }: { state: FormFeedback }) {
  if (state.kind === "idle") return null;
  if (state.kind === "error") return <p role="alert" className="text-sm text-rose-200">{state.message}</p>;
  return <p role="status" className="text-sm text-emerald-200">{state.message}</p>;
}
