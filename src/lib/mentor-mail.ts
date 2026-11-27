import { mentorAccessUrl, mentorInvitationCopy, type MentorEdition } from "./mentor-invitation-copy";

type Transport =
  | { kind: "resend"; key: string; sender: string; portalUrl: string }
  | { kind: "mailpit"; endpoint: string; portalUrl: string };

export function getMentorMailTransport(): Transport | null {
  const portalUrl = URL.parse(process.env.MENTOR_PORTAL_URL ?? "");
  if (!portalUrl || portalUrl.pathname !== "/mentores" || portalUrl.username || portalUrl.password || portalUrl.search || portalUrl.hash) return null;

  const key = process.env.RESEND_API_KEY;
  const sender = process.env.MENTOR_INVITE_FROM;
  if (key && sender && portalUrl.protocol === "https:") {
    return { kind: "resend", key, sender, portalUrl: portalUrl.href };
  }

  const mailpit = URL.parse(process.env.MENTOR_LOCAL_MAILPIT_URL ?? "");
  if (process.env.NODE_ENV === "development" && mailpit?.protocol === "http:"
    && ["localhost", "127.0.0.1"].includes(mailpit.hostname)
    && ["localhost", "127.0.0.1"].includes(portalUrl.hostname)
    && portalUrl.protocol === "http:") {
    return { kind: "mailpit", endpoint: new URL("/api/v1/send", mailpit).href, portalUrl: portalUrl.href };
  }
  return null;
}

export async function deliverMentorInvitation(transport: Transport, invitation: {
  id: string; name: string; email: string; invite_attempt: number; editionDetails: MentorEdition; accessToken: string;
}) {
  const { subject, text, html } = mentorInvitationCopy({
    name: invitation.name,
    edition: invitation.editionDetails,
    portalUrl: transport.portalUrl,
    accessUrl: mentorAccessUrl(transport.portalUrl, invitation.accessToken),
  });
  const idempotencyKey = `mentor-invite/${invitation.id}/${invitation.invite_attempt}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (transport.kind === "resend") {
    headers.Authorization = `Bearer ${transport.key}`;
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const response = await fetch(transport.kind === "resend" ? "https://api.resend.com/emails" : transport.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(transport.kind === "resend" ? {
      from: transport.sender, to: [invitation.email], subject, text, html,
    } : {
      From: { Email: "mentores@example.com", Name: "Hack IA Brasil" },
      To: [{ Email: invitation.email, Name: invitation.name }],
      Subject: subject, Text: text, HTML: html,
    }),
    redirect: "error",
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  return response.ok;
}
