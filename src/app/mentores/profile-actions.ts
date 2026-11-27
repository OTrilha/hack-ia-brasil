"use server";

import { revalidatePath } from "next/cache";
import { saveMentorProfile, type MentorProfile } from "@/lib/mentors";
import type { FormFeedback } from "./actions";

function readText(formData: FormData, field: string): string | null {
  const value = formData.get(field);
  return typeof value === "string" ? value.trim() || null : null;
}

function parseLinkedInProfile(value: string): string | null {
  if (value.length > 300) return null;

  try {
    const url = new URL(value);
    const isLinkedIn = url.hostname === "linkedin.com" || url.hostname.endsWith(".linkedin.com");
    if (!isLinkedIn || url.protocol !== "https:" || url.username || url.password || url.port || url.href.length > 300) return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function updateMentorProfile(
  _state: FormFeedback,
  formData: FormData,
): Promise<FormFeedback> {
  const displayName = readText(formData, "display_name");
  if (!displayName || displayName.length > 120) {
    return { kind: "error", message: "Informe um nome de exibição com até 120 caracteres." };
  }

  const linkedinInput = readText(formData, "linkedin_url");
  const linkedinUrl = linkedinInput ? parseLinkedInProfile(linkedinInput) : null;
  if (linkedinInput && !linkedinUrl) {
    return { kind: "error", message: "Informe um link HTTPS válido do LinkedIn." };
  }

  const profile: Omit<MentorProfile, "photo_version"> = {
    display_name: displayName,
    title: readText(formData, "title"),
    company: readText(formData, "company"),
    specialty: readText(formData, "specialty"),
    bio: readText(formData, "bio"),
    linkedin_url: linkedinUrl,
  };

  if ([profile.title, profile.company, profile.specialty].some((value) => value && value.length > 100)) {
    return { kind: "error", message: "Cargo, empresa e área de atuação devem ter até 100 caracteres cada." };
  }
  if (profile.bio && profile.bio.length > 500) {
    return { kind: "error", message: "A bio deve ter até 500 caracteres." };
  }
  const photo = formData.get("photo");
  if (photo !== null && (!(photo instanceof File) || photo.type !== "image/webp" || !photo.size || photo.size > 700 * 1024)) {
    return { kind: "error", message: "Selecione uma foto válida e tente novamente." };
  }

  try {
    if (!(await saveMentorProfile(profile, photo))) {
      return { kind: "error", message: "Não conseguimos salvar seu perfil. Confira sua sessão e tente novamente." };
    }
  } catch {
    return { kind: "error", message: "Não conseguimos salvar seu perfil agora. Tente novamente em instantes." };
  }

  revalidatePath("/mentores");
  return { kind: "success", message: "Perfil salvo." };
}
