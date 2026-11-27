"use server";

import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";
import {
  requestMentorCode,
  saveMentorResponse,
  signOutMentor,
  verifyMentorCode,
} from "@/lib/mentors";

export type AccessState =
  | { step: "email"; email?: string; error?: string }
  | { step: "code"; email: string; error?: string; notice?: string };

export type MentorDestination = "/mentores" | "/mentores/organizacao";

export type FormFeedback =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "success"; message: string };

export async function accessMentors(
  destination: MentorDestination,
  _state: AccessState,
  formData: FormData,
): Promise<AccessState> {
  const intent = formData.get("intent");
  const organizer = destination === "/mentores/organizacao";
  if (intent === "change-email") return { step: "email" };

  const submittedEmail = formData.get("email");
  const email = typeof submittedEmail === "string" ? submittedEmail.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { step: "email", email, error: organizer ? "Informe o e-mail autorizado da organização." : "Informe o e-mail que recebeu o convite." };
  }

  if (intent === "request-code" || intent === "resend-code") {
    try {
      await requestMentorCode(email, organizer);
    } catch {
      const error = "Não conseguimos solicitar o código agora. Tente novamente em instantes.";
      return { step: intent === "resend-code" ? "code" : "email", email, error };
    }

    return {
      step: "code",
      email,
      notice: organizer ? "Se este e-mail estiver autorizado, o código chega em instantes." : "Se o endereço estiver na lista de convidados, você receberá um código por e-mail.",
    };
  }

  const token = formData.get("token");
  if (intent !== "verify-code" || typeof token !== "string" || !/^\d{6}$/.test(token.trim())) {
    return { step: "code", email, error: "Informe o código de seis dígitos." };
  }

  try {
    if (!(await verifyMentorCode(email, token.trim()))) {
      return { step: "code", email, error: "Código inválido ou expirado. Confira o e-mail ou solicite outro código." };
    }
  } catch {
    return { step: "code", email, error: "Não conseguimos verificar o código agora. Tente novamente em instantes." };
  }

  redirect(destination, RedirectType.replace);
}

export async function respondToMentorInvitation(
  id: string,
  _state: FormFeedback,
  formData: FormData,
): Promise<FormFeedback> {
  const response = formData.get("response");
  const availability = formData.get("availability");
  const fullName = formData.get("full_name");

  if (response !== "confirmed" && response !== "declined") {
    return { kind: "error", message: "Escolha confirmar ou recusar o convite." };
  }
  if (typeof availability !== "string" || availability.length > 500) {
    return { kind: "error", message: "A disponibilidade deve ter até 500 caracteres." };
  }
  const name = typeof fullName === "string" ? fullName.trim() : "";
  if (response === "confirmed" && (!name || name.length > 200)) {
    return { kind: "error", message: "Informe seu nome completo para confirmar a presença." };
  }

  try {
    if (!(await saveMentorResponse(id, response, availability.trim(), name))) {
      return { kind: "error", message: "Este convite não está disponível para responder. Atualize a página e tente novamente." };
    }
  } catch {
    return { kind: "error", message: "Não conseguimos salvar sua resposta agora. Tente novamente em instantes." };
  }

  revalidatePath("/mentores");
  return {
    kind: "success",
    message: response === "confirmed" ? "Presença confirmada." : "Sua recusa foi registrada.",
  };
}

export async function leaveMentorPortal(destination: MentorDestination): Promise<FormFeedback> {
  try {
    await signOutMentor();
  } catch {
    return { kind: "error", message: "Não conseguimos encerrar a sessão. Tente novamente." };
  }

  redirect(destination === "/mentores/organizacao" ? destination : "/mentores", RedirectType.replace);
}
