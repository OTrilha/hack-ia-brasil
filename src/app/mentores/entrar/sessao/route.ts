import { signInWithAccessLink } from "@/lib/mentors";

const responseHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin || request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ signedIn: false }, { status: 403, headers: responseHeaders });
  }

  const body: unknown = await request.json().catch(() => null);
  const token = body && typeof body === "object" && "token" in body && typeof body.token === "string" ? body.token : "";
  const signedIn = await signInWithAccessLink(token).catch(() => false);
  return Response.json({ signedIn }, { status: signedIn ? 200 : 401, headers: responseHeaders });
}
