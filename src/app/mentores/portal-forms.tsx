"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import type { MentorParticipation } from "@/lib/mentors";
import {
  accessMentors,
  leaveMentorPortal,
  respondToMentorInvitation,
  type AccessState,
  type FormFeedback,
  type MentorDestination,
} from "./actions";

const initialAccess: AccessState = { step: "email" };
const initialFeedback: FormFeedback = { kind: "idle" };
const inputClass =
  "w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-base text-white placeholder:text-white/45 focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70";
const primaryButtonClass =
  "min-h-11 rounded-lg border border-white bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-white/80 hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60";
const secondaryButtonClass =
  "min-h-11 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:cursor-wait disabled:opacity-60";

export function MentorAccessForm({ destination = "/mentores" }: { destination?: MentorDestination }) {
  const [state, submit, pending] = useActionState(accessMentors.bind(null, destination), initialAccess);
  const organizer = destination === "/mentores/organizacao";
  const field = useRef<HTMLInputElement>(null);
  const previousStep = useRef(state.step);
  const errorId = useId();
  const codeHelpId = useId();

  useEffect(() => {
    if (previousStep.current !== state.step || state.error) field.current?.focus();
    previousStep.current = state.step;
  }, [state.step, state.error]);

  if (state.step === "email") {
    return (
      <form action={submit} className="grid gap-4">
        <input type="hidden" name="intent" value="request-code" />
        <label className="grid gap-2 text-sm font-medium">
          {organizer ? "E-mail autorizado" : "E-mail do convite"}
          <input
            ref={field}
            className={inputClass}
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            maxLength={254}
            defaultValue={state.email}
            required
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? errorId : undefined}
          />
        </label>
        {state.error && <p id={errorId} role="alert" className="text-sm text-rose-200">{state.error}</p>}
        <button className={primaryButtonClass} type="submit" disabled={pending}>
          {pending ? "Solicitando código…" : "Receber código"}
        </button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <p role="status" className="break-words text-sm leading-relaxed text-white/75">
        Código solicitado para <strong className="font-semibold text-white">{state.email}</strong>.
        {state.notice && <span className="mt-1 block">{state.notice}</span>}
      </p>
      <form action={submit} className="grid gap-4">
        <input type="hidden" name="intent" value="verify-code" />
        <input type="hidden" name="email" value={state.email} />
        <label className="grid gap-2 text-sm font-medium">
          Código de acesso
          <input
            ref={field}
            className={inputClass + " font-mono tracking-[0.2em]"}
            name="token"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            aria-invalid={Boolean(state.error)}
            aria-describedby={state.error ? `${codeHelpId} ${errorId}` : codeHelpId}
            onPaste={(event) => {
              const code = event.clipboardData.getData("text").replace(/[\s-]/g, "");
              if (/^\d{6}$/.test(code)) {
                event.preventDefault();
                event.currentTarget.value = code;
              }
            }}
          />
        </label>
        <p id={codeHelpId} className="-mt-2 text-sm text-white/60">Use os seis dígitos do e-mail mais recente.</p>
        {state.error && <p id={errorId} role="alert" className="text-sm text-rose-200">{state.error}</p>}
        <button className={primaryButtonClass} type="submit" disabled={pending}>
          {pending ? "Aguarde…" : organizer ? "Entrar no painel" : "Entrar na área de mentores"}
        </button>
      </form>
      <p className="text-sm leading-relaxed text-white/70">O e-mail não chegou? Confira a pasta de spam ou solicite outro código.</p>
      <div className="flex flex-wrap gap-2">
        <form action={submit}>
          <input type="hidden" name="intent" value="resend-code" />
          <input type="hidden" name="email" value={state.email} />
          <button className={secondaryButtonClass} type="submit" disabled={pending}>Reenviar código</button>
        </form>
        <form action={submit}>
          <input type="hidden" name="intent" value="change-email" />
          <button className={secondaryButtonClass} type="submit" disabled={pending}>Trocar e-mail</button>
        </form>
      </div>
    </div>
  );
}

export function MentorResponseForm({
  id,
  availability,
  fullName,
}: Pick<MentorParticipation, "id" | "availability"> & { fullName: string }) {
  const [note, setNote] = useState(availability ?? "");
  const [name, setName] = useState(fullName);
  const [state, submit, pending] = useActionState(
    respondToMentorInvitation.bind(null, id),
    initialFeedback,
  );

  return (
    <form action={submit} className="grid gap-4 border-t border-white/15 pt-5 print:hidden">
      <label className="grid gap-2 text-sm font-medium">
        Nome completo
        <span className="-mt-1 font-normal text-white/60">Como no seu documento ou passaporte. É o nome que vai na sua declaração.</span>
        <input
          className={inputClass}
          name="full_name"
          autoComplete="name"
          maxLength={200}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-2 text-sm font-medium">
        Disponibilidade <span className="-mt-1 font-normal text-white/60">Opcional</span>
        <textarea
          className={inputClass + " min-h-24"}
          name="availability"
          maxLength={500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Ex. Posso acompanhar equipes durante a manhã"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={primaryButtonClass} type="submit" name="response" value="confirmed" disabled={pending}>
          Confirmar presença
        </button>
        <button className={secondaryButtonClass} type="submit" name="response" value="declined" formNoValidate disabled={pending}>
          Recusar convite
        </button>
      </div>
      {pending ? <p role="status" className="text-sm text-white/75">Salvando resposta…</p> : <FormMessage state={state} />}
    </form>
  );
}

export function MentorSignOutButton({ destination = "/mentores", label = "Sair" }: { destination?: MentorDestination; label?: string }) {
  const [state, submit, pending] = useActionState(leaveMentorPortal.bind(null, destination), initialFeedback);

  return (
    <form action={submit} className="grid gap-2 print:hidden">
      <button className={secondaryButtonClass} type="submit" disabled={pending}>
        {pending ? "Saindo…" : label}
      </button>
      <FormMessage state={state} />
    </form>
  );
}

export function MentorPrintButton() {
  return (
    <button className={secondaryButtonClass + " print:hidden"} type="button" onClick={() => window.print()}>
      Salvar página em PDF
    </button>
  );
}

function FormMessage({ state }: { state: FormFeedback }) {
  if (state.kind === "error") return <p role="alert" className="text-sm text-rose-200">{state.message}</p>;
  if (state.kind === "success") return <p role="status" className="text-sm text-white/85">{state.message}</p>;
  return null;
}
