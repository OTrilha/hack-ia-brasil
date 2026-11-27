import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { CURRENT_MENTOR_EDITION, isMentorRole, MENTOR_LINK_DAYS, type MentorEdition, type MentorRole } from "./mentor-invitation-copy";
import { deliverMentorInvitation, getMentorMailTransport } from "./mentor-mail";
import { getMentorSupabaseConfig } from "./mentor-supabase";
import { createMentorClient, hashAccessToken, recordMentorOperation, type MentorParticipation } from "./mentors";

export type { MentorEdition } from "./mentor-invitation-copy";

export type MentorInvite = {
  id: string;
  name: string;
  edition: string;
  email: string;
  response: MentorParticipation["response"];
  invite_attempt: number;
  sent_attempt: number;
  invitation_sent_at: string | null;
  invitation_drafted: boolean;
  invitation_revision: number;
  invitation_attempt_started_at: string | null;
  delivery_failed_at: string | null;
  verified_at: string | null;
  activity: string | null;
  has_pdf_pt: boolean;
  has_pdf_en: boolean;
  full_name: string | null;
  role: MentorRole;
};

export type InviteResult = { kind: "sent" } | { kind: "already-sent" } | { kind: "saved" } | { kind: "error"; message: string };
type InvitationRow = Omit<MentorInvite, "email"> & {
  mentor_id: string;
  invitation_claim_id: string | null;
  invitation_claimed_at: string | null;
  access_token_hash: string | null;
  access_token_expires_at: string | null;
};

type OrganizationDatabase = {
  public: {
    Tables: {
      mentor_participations: {
        Row: InvitationRow;
        Insert: Pick<InvitationRow, "mentor_id" | "edition" | "name" | "invitation_drafted">;
        Update: Partial<InvitationRow>;
        Relationships: [];
      };
      mentor_editions: { Row: MentorEdition; Insert: never; Update: Partial<Omit<MentorEdition, "name">>; Relationships: [] };
    };
    Views: { mentor_invitation_roster: { Row: MentorInvite; Relationships: [] } };
    Functions: { mentor_account_id: { Args: { target_email: string }; Returns: string | null } };
  };
};

export async function getOrganizerAccess() {
  const supabase = await createMentorClient();
  if (!supabase) return { kind: "unconfigured" } as const;

  const { data, error } = await supabase.auth.getUser();
  if (!data.user) {
    const noSession = !error || error.name === "AuthSessionMissingError" || [400, 401, 403].includes(error.status ?? 0);
    return noSession ? { kind: "signed-out" } as const : { kind: "error" } as const;
  }

  const organizer = await supabase.from("mentor_organizers").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (organizer.error) return { kind: "error" } as const;
  if (!organizer.data) return { kind: "forbidden" } as const;

  const config = getMentorSupabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key) return { kind: "unconfigured" } as const;

  const admin = createClient<OrganizationDatabase>(config.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return { kind: "signed-in", admin } as const;
}

export async function getOrganizerContext() {
  const access = await getOrganizerAccess();
  if (access.kind !== "signed-in") return access;

  const [edition, invites] = await Promise.all([
    access.admin.from("mentor_editions").select("*").eq("name", CURRENT_MENTOR_EDITION).single(),
    access.admin.from("mentor_invitation_roster").select("*").eq("edition", CURRENT_MENTOR_EDITION).order("name"),
  ]);
  if (edition.error || invites.error) return { kind: "error" } as const;

  const transport = getMentorMailTransport();
  return { kind: "signed-in", invites: invites.data, edition: edition.data, mailReady: Boolean(transport), portalUrl: transport?.portalUrl ?? null } as const;
}

const requestError = { kind: "error", message: "Não foi possível salvar o convite. Confira os dados e tente novamente." } as const;
const accessError = { kind: "error", message: "Entre com uma conta da organização para gerenciar convites." } as const;
const mailError = { kind: "error", message: "O envio de convites ainda não está configurado." } as const;
const inProgress = { kind: "error", message: "O envio ainda não foi confirmado. Acompanhe o status na lista." } as const;

type Admin = Extract<Awaited<ReturnType<typeof getOrganizerAccess>>, { kind: "signed-in" }>["admin"];
type Transport = NonNullable<ReturnType<typeof getMentorMailTransport>>;

async function sendPendingInvitation(admin: Admin, transport: Transport, invite: MentorInvite, editionDetails: MentorEdition): Promise<InviteResult> {
  if (invite.sent_attempt === invite.invite_attempt) return { kind: "already-sent" };

  const startedAt = performance.now();
  const claim = crypto.randomUUID();
  const now = new Date().toISOString();
  const expired = new Date(Date.now() - 60_000).toISOString();
  const { data, error } = await admin.from("mentor_participations")
    .update({ invitation_claim_id: claim, invitation_claimed_at: now, invitation_attempt_started_at: now, delivery_failed_at: null })
    .eq("id", invite.id).eq("response", "invited").eq("invite_attempt", invite.invite_attempt).lt("sent_attempt", invite.invite_attempt)
    .eq("invitation_revision", invite.invitation_revision).is("verified_at", null)
    .or(`invitation_claim_id.is.null,invitation_claimed_at.lt.${expired}`).select("id").maybeSingle();
  if (error) return requestError;
  if (!data) {
    const latest = await admin.from("mentor_participations").select("sent_attempt")
      .eq("id", invite.id).maybeSingle();
    if (latest.data && latest.data.sent_attempt >= invite.invite_attempt) return { kind: "already-sent" };
    return inProgress;
  }

  // A new link replaces the previous one only once the provider accepts the e-mail that carries it.
  const accessToken = randomBytes(32).toString("base64url");
  let sent = false;
  try {
    sent = await deliverMentorInvitation(transport, { ...invite, editionDetails, accessToken });
  } catch {
    sent = false;
  }

  const completion = await admin.from("mentor_participations")
    .update({ invitation_claim_id: null, invitation_claimed_at: null, delivery_failed_at: sent ? null : new Date().toISOString(), ...(sent ? {
      sent_attempt: invite.invite_attempt,
      invitation_sent_at: new Date().toISOString(),
      invitation_drafted: false,
      access_token_hash: hashAccessToken(accessToken),
      access_token_expires_at: new Date(Date.now() + MENTOR_LINK_DAYS * 86_400_000).toISOString(),
    } : {}) })
    .eq("id", invite.id).eq("invitation_claim_id", claim).select("id").maybeSingle();
  const saved = !completion.error && Boolean(completion.data);
  recordMentorOperation("send_invitation", !saved ? "status_failed" : sent ? "sent" : "failed", startedAt);
  if (!saved) return inProgress;
  if (!sent) return { kind: "error", message: "O convite foi salvo, mas o provedor não confirmou o envio. Tente novamente na lista." };
  return { kind: "sent" };
}

const invalidEdition = {
  kind: "error",
  message: "Informe uma data válida, horário, local e endereço para a edição.",
} as const;
const pendingEdition = {
  kind: "error",
  message: "Complete a data, o horário, o local e o endereço da edição antes de enviar.",
} as const;
const changedDraft = {
  kind: "error",
  message: "O convite mudou ou já teve uma tentativa de envio. Confira os dados na lista.",
} as const;
const duplicateInvite = {
  kind: "error",
  message: "Já existe um convite para este e-mail nesta edição. Confira a lista.",
} as const;

function validId(id: string) {
  return /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/.test(id);
}

function validEditionDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + "T00:00:00Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

export async function saveMentorEdition(value: Omit<MentorEdition, "name">): Promise<InviteResult> {
  const event_date = value.event_date?.trim();
  const hours = value.hours?.trim();
  const venue = value.venue?.trim();
  const address = value.address?.trim();
  const map = value.map_url?.trim() ?? "";
  const url = map ? URL.parse(map) : null;

  if (!event_date || !validEditionDate(event_date) || !hours || hours.length > 120
    || !venue || venue.length > 180 || !address || address.length > 350) return invalidEdition;
  if (map && (!url || url.protocol !== "https:" || url.username || url.password || map.length > 1500)) {
    return { kind: "error", message: "Use um link HTTPS válido para o mapa." };
  }

  const access = await getOrganizerAccess();
  if (access.kind !== "signed-in") return accessError;
  const { data, error } = await access.admin.from("mentor_editions")
    .update({ event_date, hours, venue, address, map_url: url?.href ?? null })
    .eq("name", CURRENT_MENTOR_EDITION).select("name").maybeSingle();
  if (error || !data) return { kind: "error", message: "Não foi possível salvar os dados da edição." };
  return { kind: "saved" };
}

async function resolveMentorAccount(admin: Admin, email: string) {
  const account = await admin.rpc("mentor_account_id", { target_email: email });
  if (account.error || account.data) return account.data;
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.data.user) return created.data.user.id;
  if (created.error?.code !== "email_exists") return null;
  return (await admin.rpc("mentor_account_id", { target_email: email })).data;
}

export async function saveMentorDraft(form: {
  id: string | null; name: string; email: string; revision: number;
}): Promise<InviteResult> {
  const name = form.name.trim();
  const edition = CURRENT_MENTOR_EDITION;
  const email = form.email.trim().toLowerCase();
  if (!name || name.length > 200 || /[\r\n]/.test(name)
    || email.length > 254 || !/^[^\s@,<>]+@[^\s@,<>]+\.[^\s@,<>]+$/.test(email)) return requestError;
  if (form.id && (!validId(form.id) || !Number.isSafeInteger(form.revision) || form.revision < 0)) return changedDraft;

  const access = await getOrganizerAccess();
  if (access.kind !== "signed-in") return accessError;
  const { admin } = access;

  const details = await admin.from("mentor_editions").select("name").eq("name", edition).maybeSingle();
  if (details.error || !details.data) return invalidEdition;
  if (form.id) {
    const current = await admin.from("mentor_participations").select("id")
      .eq("id", form.id).eq("edition", edition).eq("invitation_drafted", true)
      .eq("invitation_revision", form.revision).is("invitation_attempt_started_at", null).maybeSingle();
    if (current.error || !current.data) return changedDraft;
  }

  const mentorId = await resolveMentorAccount(admin, email);
  if (!mentorId) return requestError;

  const saved = form.id
    ? await admin.from("mentor_participations")
      .update({ mentor_id: mentorId, name, invitation_revision: form.revision + 1 })
      .eq("id", form.id).eq("edition", edition).eq("invitation_drafted", true)
      .eq("invitation_revision", form.revision).is("invitation_attempt_started_at", null).select("id").maybeSingle()
    : await admin.from("mentor_participations")
      .insert({ mentor_id: mentorId, name, edition, invitation_drafted: true }).select("id").maybeSingle();
  if (saved.error?.code === "23505") return duplicateInvite;
  if (saved.error) return requestError;
  if (!saved.data) return changedDraft;
  return { kind: "saved" };
}

export async function sendMentorInvitation(
  id: string, expectedAttempt: number, expectedRevision: number, expectedSentAttempt: number, editionSnapshot: string,
): Promise<InviteResult> {
  if (!validId(id) || !Number.isSafeInteger(expectedAttempt) || expectedAttempt < 1
    || !Number.isSafeInteger(expectedRevision) || expectedRevision < 0
    || !Number.isSafeInteger(expectedSentAttempt) || expectedSentAttempt < 0 || expectedSentAttempt > expectedAttempt) return requestError;

  const access = await getOrganizerAccess();
  if (access.kind !== "signed-in") return accessError;
  const transport = getMentorMailTransport();
  if (!transport) return mailError;
  const { admin } = access;
  const { data: invite, error } = await admin.from("mentor_invitation_roster").select("*").eq("id", id).maybeSingle();
  if (error || !invite) return requestError;
  if (invite.verified_at || invite.response !== "invited") {
    return { kind: "error", message: "Este convite já foi respondido ou a atuação foi validada." };
  }
  if (invite.invitation_revision !== expectedRevision) return changedDraft;
  if (invite.invite_attempt !== expectedAttempt || invite.sent_attempt !== expectedSentAttempt) {
    return invite.sent_attempt === invite.invite_attempt ? { kind: "already-sent" } : inProgress;
  }

  const { data: edition, error: editionError } = await admin.from("mentor_editions")
    .select("*").eq("name", invite.edition).maybeSingle();
  if (editionError || !edition?.event_date || !edition.hours || !edition.venue || !edition.address) return pendingEdition;
  let snapshot: unknown;
  try {
    snapshot = JSON.parse(editionSnapshot);
  } catch {
    snapshot = null;
  }
  if (!snapshot || typeof snapshot !== "object"
    || Object.entries(edition).some(([key, value]) => Reflect.get(snapshot, key) !== value)) {
    return { kind: "error", message: "Os dados da edição mudaram. Confira a nova prévia antes de enviar." };
  }
  if (invite.sent_attempt < invite.invite_attempt) return sendPendingInvitation(admin, transport, invite, edition);

  const nextAttempt = expectedAttempt + 1;
  const result = await admin.from("mentor_participations").update({ invite_attempt: nextAttempt })
    .eq("id", id).eq("response", "invited").is("verified_at", null).eq("invite_attempt", expectedAttempt)
    .eq("sent_attempt", expectedAttempt).select("id").maybeSingle();
  if (result.error) return requestError;
  if (!result.data) return inProgress;
  return sendPendingInvitation(admin, transport, { ...invite, invite_attempt: nextAttempt }, edition);
}

export async function verifyMentorParticipation(id: string, role: string, activity: string): Promise<InviteResult> {
  const description = activity.trim();
  const failure = { kind: "error", message: "Não foi possível salvar a atuação deste mentor." } as const;
  if (!isMentorRole(role)) return { kind: "error", message: "Escolha o papel exercido no evento." };
  if (!validId(id) || !description || description.length > 3000) {
    return { kind: "error", message: "Descreva a atuação do mentor em até 3.000 caracteres." };
  }

  const access = await getOrganizerAccess();
  if (access.kind !== "signed-in") return accessError;
  const { admin } = access;
  const saved = await admin.from("mentor_participations").update({ role, activity: description })
    .eq("id", id).eq("invitation_drafted", false).not("verified_at", "is", null).select("id").maybeSingle();
  if (saved.error) return failure;
  if (saved.data) return { kind: "saved" };

  const startedAt = performance.now();
  const verified = await admin.from("mentor_participations")
    .update({ role, activity: description, verified_at: new Date().toISOString() })
    .eq("id", id).eq("invitation_drafted", false).is("verified_at", null).select("id").maybeSingle();
  recordMentorOperation("verify_participation", verified.data ? "saved" : "rejected", startedAt);
  return !verified.error && verified.data ? { kind: "saved" } : failure;
}
