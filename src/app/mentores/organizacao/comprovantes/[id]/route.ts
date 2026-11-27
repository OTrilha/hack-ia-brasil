import { getOrganizerAccess } from "@/lib/mentor-organizers";
import { recordMentorOperation } from "@/lib/mentors";

const maxPdfBytes = 4 * 1024 * 1024;
const responseHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

function failure(message: string, status: number) {
  return Response.json({ message }, { status, headers: responseHeaders });
}

export async function POST(request: Request, context: RouteContext<"/mentores/organizacao/comprovantes/[id]">) {
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return failure("Abra o painel para publicar uma declaração.", 403);
  }

  const { id } = await context.params;
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) {
    return failure("Participação indisponível.", 404);
  }

  const access = await getOrganizerAccess();
  if (access.kind === "signed-out" || access.kind === "forbidden") {
    return failure("Entre com uma conta da organização para publicar a declaração.", 403);
  }
  if (access.kind !== "signed-in") {
    return failure("Não foi possível acessar o painel agora. Tente novamente.", 503);
  }

  if (Number(request.headers.get("content-length")) > maxPdfBytes + 32 * 1024) {
    return failure("Escolha um PDF de até 4 MB.", 413);
  }
  const form = await request.formData().catch(() => null);
  const language = form?.get("idioma");
  const file = form?.get("arquivo");
  if ((language !== "pt" && language !== "en") || !(file instanceof File)) {
    return failure("Escolha o idioma e o PDF da declaração.", 400);
  }
  if (file.size > maxPdfBytes) return failure("Escolha um PDF de até 4 MB.", 413);
  const signature = await file.slice(0, 5).text();
  if (signature !== "%PDF-" || file.size <= 5) return failure("Escolha um arquivo PDF válido.", 400);

  const { admin } = access;
  const publishedField = language === "pt" ? "has_pdf_pt" : "has_pdf_en";
  const { data: participation, error } = await admin.from("mentor_participations")
    .select("verified_at, has_pdf_pt, has_pdf_en")
    .eq("id", id).eq("invitation_drafted", false).maybeSingle();
  if (error) return failure("Não foi possível consultar a participação. Tente novamente.", 503);
  if (!participation?.verified_at) return failure("Valide a atuação do mentor antes de publicar a declaração.", 409);
  if (participation[publishedField]) return failure("Já existe uma declaração publicada neste idioma.", 409);

  const started = performance.now();
  const bucket = admin.storage.from("mentor-certificates");
  const path = `${id}/${language}.pdf`;
  const pdf = Buffer.from(await file.arrayBuffer());
  const upload = await bucket.upload(path, pdf, { contentType: "application/pdf", upsert: false });
  if (upload.error) {
    // An interrupted publication can leave the file stored before the database flag is set.
    const { data: stored, error: readError } = await bucket.download(path);
    if (readError || !stored) {
      recordMentorOperation("publish_declaration", "upload_failed", started);
      return failure("Não foi possível salvar o PDF. Tente novamente.", 503);
    }
    if (stored.size !== pdf.length || !pdf.equals(Buffer.from(await stored.arrayBuffer()))) {
      recordMentorOperation("publish_declaration", "conflict", started);
      return failure("Existe um PDF salvo para este idioma. Selecione o mesmo arquivo para concluir a publicação.", 409);
    }
  }

  const published = await admin.from("mentor_participations")
    .update(language === "pt" ? { has_pdf_pt: true } : { has_pdf_en: true })
    .eq("id", id).eq("invitation_drafted", false).not("verified_at", "is", null)
    .eq(publishedField, false).select("id").maybeSingle();
  if (published.error || !published.data) {
    recordMentorOperation("publish_declaration", "publication_unconfirmed", started);
    return failure("A publicação ficou pendente. Recarregue o painel e, se necessário, selecione o mesmo PDF.", 503);
  }

  recordMentorOperation("publish_declaration", "published", started);
  return Response.json({ message: "Declaração publicada para o mentor." }, { headers: responseHeaders });
}
