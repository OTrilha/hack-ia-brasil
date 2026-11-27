"use server";

import { revalidatePath } from "next/cache";
import {
  saveMentorDraft,
  saveMentorEdition,
  sendMentorInvitation,
  verifyMentorParticipation,
  type InviteResult,
} from "@/lib/mentor-organizers";
import type { FormFeedback } from "../actions";

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function feedback(operation: Promise<InviteResult>, message: string): Promise<FormFeedback> {
  const result = await operation.catch<InviteResult>(() => ({
    kind: "error", message: "Não foi possível concluir agora. Tente novamente em instantes.",
  }));
  revalidatePath("/mentores/organizacao");
  if (result.kind === "error") return { kind: "error", message: result.message };
  return { kind: "success", message: result.kind === "already-sent" ? "Este envio já foi registrado." : message };
}

export async function saveEdition(_state: FormFeedback, form: FormData): Promise<FormFeedback> {
  const result = await feedback(saveMentorEdition({
    event_date: field(form, "event_date"),
    hours: field(form, "hours"),
    venue: field(form, "venue"),
    address: field(form, "address"),
    map_url: field(form, "map_url"),
  }), "Dados do evento salvos.");
  if (result.kind === "success") revalidatePath("/mentores");
  return result;
}

export async function saveDraft(id: string | null, _state: FormFeedback, form: FormData): Promise<FormFeedback> {
  return feedback(saveMentorDraft({
    id, name: field(form, "name"), email: field(form, "email"),
    revision: Number(field(form, "invitation_revision")),
  }), "Rascunho salvo.");
}

export async function sendInvitation(
  id: string, expectedAttempt: number, expectedRevision: number, ...[, form]: [FormFeedback, FormData]
): Promise<FormFeedback> {
  return feedback(sendMentorInvitation(
    id, expectedAttempt, expectedRevision, Number(field(form, "sent_attempt")), field(form, "edition_snapshot"),
  ), "Convite enviado.");
}

export async function verifyParticipation(id: string, _state: FormFeedback, form: FormData): Promise<FormFeedback> {
  const result = await feedback(verifyMentorParticipation(id, field(form, "role"), field(form, "activity")), "Atuação validada.");
  if (result.kind === "success") revalidatePath("/mentores");
  return result;
}
