"use client";

import Image from "next/image";
import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import type { MentorProfile } from "@/lib/mentors";
import type { FormFeedback } from "./actions";
import { updateMentorProfile } from "./profile-actions";

const initialFeedback: FormFeedback = { kind: "idle" };
const inputClass = "w-full rounded-lg border border-white/20 bg-black px-4 py-3 text-base text-white placeholder:text-white/45 focus-visible:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70";

const profileFields = [
  { name: "display_name", label: "Nome de exibição", maxLength: 120, autoComplete: "name", required: true },
  { name: "title", label: "Cargo", maxLength: 100, autoComplete: "organization-title" },
  { name: "company", label: "Empresa", maxLength: 100, autoComplete: "organization" },
  { name: "specialty", label: "Área de atuação", maxLength: 100 },
  { name: "linkedin_url", label: "LinkedIn", maxLength: 300, autoComplete: "url", type: "url", placeholder: "https://www.linkedin.com/in/seu-perfil" },
] satisfies Array<{
  name: keyof Omit<MentorProfile, "photo_version" | "bio">;
  label: string;
  maxLength: number;
  autoComplete?: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
}>;

type PhotoSelection =
  | { kind: "unchanged" }
  | { kind: "preparing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; file: File; preview: string };

async function preparePhoto(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    for (const quality of [0.84, 0.68, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (blob?.type !== "image/webp") break;
      if (blob.size <= 700 * 1024) return new File([blob], "foto.webp", { type: blob.type });
    }
    throw new Error("Could not convert photo to WebP");
  } finally {
    bitmap.close();
  }
}

export function MentorProfileForm({
  profile,
  invitedName,
}: {
  profile: MentorProfile | null;
  invitedName?: string;
}) {
  const [fields, setFields] = useState({
    display_name: profile?.display_name ?? invitedName ?? "",
    title: profile?.title ?? "",
    company: profile?.company ?? "",
    specialty: profile?.specialty ?? "",
    linkedin_url: profile?.linkedin_url ?? "",
    bio: profile?.bio ?? "",
  });
  const [photo, setPhoto] = useState<PhotoSelection>({ kind: "unchanged" });
  const preview = photo.kind === "ready" ? photo.preview : undefined;
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const [feedback, submit, pending] = useActionState(async (state: FormFeedback, formData: FormData) => {
    if (photo.kind === "ready") formData.set("photo", photo.file);
    const result = await updateMentorProfile(state, formData);
    if (result.kind === "success") setPhoto({ kind: "unchanged" });
    return result;
  }, initialFeedback);

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    input.value = "";
    if (file.size > 15 * 1024 * 1024) {
      setPhoto({ kind: "error", message: "Escolha uma imagem de até 15 MB." });
      return;
    }
    setPhoto({ kind: "preparing" });
    try {
      const image = await preparePhoto(file);
      setPhoto({ kind: "ready", file: image, preview: URL.createObjectURL(image) });
    } catch {
      setPhoto({ kind: "error", message: "Não conseguimos abrir essa imagem. Tente uma foto em JPEG, PNG ou WebP." });
    }
  }

  const savedPhoto = profile?.photo_version && `/mentores/foto?v=${encodeURIComponent(profile.photo_version)}`;
  const imageUrl = preview ?? savedPhoto;

  return (
    <section aria-labelledby="mentor-profile-heading" className="mt-8 rounded-2xl border border-white/15 bg-white/[0.035] p-5 sm:mt-10 sm:p-7 print:hidden">
      <h2 id="mentor-profile-heading" className="text-xl font-medium">Seu perfil</h2>
      <p className="mt-2 text-sm leading-relaxed text-white/70">Seu perfil é privado. Você pode completar os detalhes quando quiser.</p>

      <form action={submit} className="mt-6 grid gap-5">
        <div className="flex flex-wrap items-center gap-4">
          {imageUrl ? (
            <Image src={imageUrl} alt="Sua foto de perfil" width={80} height={80} unoptimized className="h-20 w-20 rounded-full border border-white/20 object-cover" />
          ) : (
            <div aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-full border border-white/20 bg-black text-2xl text-white/70">
              {fields.display_name.trim().slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="grid min-w-0 gap-2">
            <label className="grid gap-2 text-sm font-medium">
              Foto de perfil
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selectPhoto}
                disabled={pending || photo.kind === "preparing"}
                className="max-w-full text-sm text-white/70 file:mr-3 file:rounded-lg file:border file:border-white/20 file:bg-black file:px-3 file:py-2 file:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 disabled:opacity-60"
              />
            </label>
            {photo.kind === "preparing" && <p role="status" className="text-sm text-white/70">Preparando foto…</p>}
            {photo.kind === "error" && <p role="alert" className="text-sm text-rose-200">{photo.message}</p>}
            {photo.kind === "ready" && (
              <button type="button" onClick={() => setPhoto({ kind: "unchanged" })} disabled={pending} className="w-fit text-sm text-white/75 underline decoration-white/35 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Descartar foto selecionada
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {profileFields.map(({ name, label, ...props }) => (
            <label key={name} className="grid gap-2 text-sm font-medium">
              {label}
              <input
                {...props}
                name={name}
                value={fields[name]}
                onChange={(event) => setFields({ ...fields, [name]: event.target.value })}
                className={inputClass}
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            Bio curta
            <textarea
              name="bio"
              value={fields.bio}
              onChange={(event) => setFields({ ...fields, bio: event.target.value })}
              className={inputClass + " min-h-24"}
              maxLength={500}
              placeholder="Conte um pouco sobre sua experiência"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending || photo.kind === "preparing"} className="min-h-11 rounded-lg border border-white bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:border-white/80 hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-60">
            {pending ? "Salvando perfil…" : "Salvar perfil"}
          </button>
          {feedback.kind === "error" && <p role="alert" className="text-sm text-rose-200">{feedback.message}</p>}
          {feedback.kind === "success" && <p role="status" className="text-sm text-white/85">{feedback.message}</p>}
        </div>
      </form>
    </section>
  );
}
