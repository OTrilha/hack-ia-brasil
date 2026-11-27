import { getMentorDeclaration } from "@/lib/mentors";

export async function GET(_request: Request, context: RouteContext<"/mentores/comprovantes/[id]/[idioma]">) {
  const { id, idioma } = await context.params;
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id) || (idioma !== "pt" && idioma !== "en")) {
    return new Response(null, { status: 404, headers });
  }

  const pdf = await getMentorDeclaration(id, idioma);
  if (!pdf) return new Response(null, { status: 404, headers });

  return new Response(pdf, {
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hack-ia-brasil-mentoria-${id}-${idioma}.pdf"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
