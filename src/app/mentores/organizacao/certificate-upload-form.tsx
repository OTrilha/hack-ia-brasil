"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Language = "pt" | "en";
type Feedback = { kind: "success" | "error"; message: string };

const languages: { value: Language; label: string }[] = [
  { value: "pt", label: "Português" },
  { value: "en", label: "Inglês" },
];

export function CertificateUploadForm({ id, hasPdfPt, hasPdfEn }: { id: string; hasPdfPt: boolean; hasPdfEn: boolean }) {
  const router = useRouter();
  const [publishedHere, setPublishedHere] = useState({ pt: false, en: false });
  const [feedback, setFeedback] = useState<Feedback>();
  const [pending, setPending] = useState(false);

  const published = { pt: hasPdfPt || publishedHere.pt, en: hasPdfEn || publishedHere.en };
  const available = languages.filter(({ value }) => !published[value]);

  async function uploadDeclaration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const body = new FormData(form);
    const file = body.get("arquivo");
    const language = body.get("idioma");
    if (!(file instanceof File) || (language !== "pt" && language !== "en")) return;
    if (file.size > 4 * 1024 * 1024) {
      setFeedback({ kind: "error", message: "Escolha um PDF de até 4 MB." });
      return;
    }

    setPending(true);
    setFeedback(undefined);
    try {
      const response = await fetch(`/mentores/organizacao/comprovantes/${encodeURIComponent(id)}`, { method: "POST", body });
      const result: unknown = await response.json().catch(() => null);
      const message = result && typeof result === "object" && "message" in result && typeof result.message === "string"
        ? result.message
        : "Não foi possível confirmar a publicação. Tente novamente.";
      setFeedback({ kind: response.ok ? "success" : "error", message });
      if (response.ok) {
        form.reset();
        setPublishedHere((current) => ({ ...current, [language]: true }));
        router.refresh();
      }
    } catch {
      setFeedback({ kind: "error", message: "Não foi possível confirmar a publicação. Tente novamente." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Declarações em PDF" className="grid min-w-0 gap-3 border-t border-white/15 pt-4">
      <h4 className="font-medium">Declarações em PDF</h4>
      <dl className="grid gap-1 text-sm text-white/75">
        {languages.map(({ value, label }) => (
          <div key={value} className="flex flex-wrap items-baseline gap-x-3">
            <dt>{label}</dt>
            <dd className={published[value] ? "text-emerald-200" : "text-white/60"}>
              {published[value] ? "Publicada" : "Aguardando arquivo"}
            </dd>
          </div>
        ))}
      </dl>
      {available.length > 0 && (
        <form onSubmit={uploadDeclaration} className="grid gap-3" aria-busy={pending}>
          <fieldset disabled={pending} className="grid min-w-0 gap-3 disabled:opacity-65">
            <label className="grid gap-2 text-sm">
              Idioma da declaração
              <select key={available[0].value} name="idioma" required className="w-fit max-w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white">
                {available.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid min-w-0 gap-2 text-sm">
              PDF assinado (até 4 MB)
              <input name="arquivo" type="file" accept="application/pdf,.pdf" required className="min-w-0 max-w-full rounded-lg border border-white/20 bg-black p-2 text-sm text-white file:mr-3 file:rounded-md file:border-none file:bg-white/15 file:px-3 file:py-1.5 file:text-white" />
            </label>
            <button type="submit" className="w-fit rounded-lg border border-white/20 px-4 py-2.5 text-sm font-medium hover:border-white/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
              {pending ? "Publicando…" : "Publicar declaração"}
            </button>
          </fieldset>
        </form>
      )}
      {feedback && (
        <p role={feedback.kind === "error" ? "alert" : "status"} className={feedback.kind === "error" ? "text-sm text-rose-200" : "text-sm text-emerald-200"}>
          {feedback.message}
        </p>
      )}
    </section>
  );
}
