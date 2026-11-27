import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { metric } from "@vercel/functions";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import type { MentorEdition, MentorRole } from "./mentor-invitation-copy";
import { getMentorSupabaseConfig, mentorCookieOptions, withMentorSessionLifetime } from "./mentor-supabase";

type ParticipationRow = {
  id: string;
  edition: string;
  name: string;
  full_name: string | null;
  role: MentorRole;
  response: "invited" | "confirmed" | "declined";
  availability: string | null;
  verified_at: string | null;
  activity: string | null;
  has_pdf_pt: boolean;
  has_pdf_en: boolean;
};

export type MentorParticipation = ParticipationRow & { event: MentorEdition | null };

export type MentorProfile = {
  display_name: string;
  title: string | null;
  company: string | null;
  specialty: string | null;
  bio: string | null;
  linkedin_url: string | null;
  photo_version: string | null;
};

type ProfileRow = MentorProfile & { mentor_id: string };
type ProfileInsert = Omit<ProfileRow, "photo_version"> & { photo_version?: string };

type MentorDatabase = {
  public: {
    Tables: {
      mentor_participations: {
        Row: ParticipationRow & {
          mentor_id: string;
          responded_at: string | null;
          invitation_drafted: boolean;
          access_token_hash: string | null;
          access_token_expires_at: string | null;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      mentor_profiles: { Row: ProfileRow; Insert: ProfileInsert; Update: Partial<ProfileRow>; Relationships: [] };
      mentor_organizers: { Row: { user_id: string }; Insert: never; Update: never; Relationships: [] };
      mentor_editions: { Row: MentorEdition; Insert: never; Update: never; Relationships: [] };
    };
    Views: Record<string, never>;
    Functions: {
      mentor_login_allowed: { Args: { target_email: string; organization_only: boolean }; Returns: boolean };
      respond_to_mentor_invite: {
        Args: { participation_id: string; new_response: string; new_availability: string; new_full_name: string };
        Returns: boolean;
      };
    };
  };
};

type MentorContext =
  | { kind: "unconfigured" }
  | { kind: "signed-out" }
  | { kind: "error" }
  | { kind: "signed-in"; participations: MentorParticipation[]; profile: MentorProfile | null; isOrganizer: boolean };

export async function createMentorClient() {
  const cookieStore = await cookies();
  const config = getMentorSupabaseConfig();
  if (!config) return null;

  return createServerClient<MentorDatabase>(config.url, config.key, {
    cookieOptions: mentorCookieOptions,
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, withMentorSessionLifetime(options));
        } catch {
          // The proxy refreshes sessions before Server Components render.
        }
      },
    },
  });
}

export function recordMentorOperation(operation: string, outcome: string, startedAt: number) {
  metric("mentor_portal_operation", 1, { operation, outcome });
  metric("mentor_portal_duration_ms", Math.round(performance.now() - startedAt), { operation, outcome });
}

export async function getMentorContext(): Promise<MentorContext> {
  const supabase = await createMentorClient();
  if (!supabase) return { kind: "unconfigured" };

  const { data, error: authError } = await supabase.auth.getUser();
  if (!data.user) {
    const noSession = !authError || authError.name === "AuthSessionMissingError"
      || [400, 401, 403].includes(authError.status ?? 0);
    return { kind: noSession ? "signed-out" : "error" };
  }

  const mentorId = data.user.id;
  const [participations, profile, organizer] = await Promise.all([
    supabase.from("mentor_participations")
      .select("id, edition, name, full_name, role, response, availability, verified_at, activity, has_pdf_pt, has_pdf_en")
      .eq("mentor_id", mentorId)
      .eq("invitation_drafted", false)
      .order("verified_at", { ascending: false, nullsFirst: true })
      .order("edition", { ascending: false }),
    supabase.from("mentor_profiles").select("display_name, title, company, specialty, bio, linkedin_url, photo_version")
      .eq("mentor_id", mentorId).maybeSingle(),
    supabase.from("mentor_organizers").select("user_id").eq("user_id", mentorId).maybeSingle(),
  ]);
  if (participations.error || profile.error || organizer.error) return { kind: "error" };

  const byEdition = new Map<string, MentorEdition>();
  if (participations.data.length) {
    const startedAt = performance.now();
    const { data: editions, error } = await supabase.from("mentor_editions")
      .select("name, event_date, hours, venue, address, map_url")
      .in("name", [...new Set(participations.data.map((entry) => entry.edition))]);
    recordMentorOperation("read_editions", error ? "unavailable" : "loaded", startedAt);
    if (error) return { kind: "error" };
    for (const edition of editions) byEdition.set(edition.name, edition);
  }

  const entries = participations.data.map((entry) => ({ ...entry, event: byEdition.get(entry.edition) ?? null }));
  return { kind: "signed-in", participations: entries, profile: profile.data, isOrganizer: Boolean(organizer.data) };
}

export async function saveMentorProfile(profile: Omit<MentorProfile, "photo_version">, photo: File | null) {
  const startedAt = performance.now();
  const supabase = await createMentorClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const values: ProfileInsert = { ...profile, mentor_id: user.id };
  if (photo) {
    if (photo.size < 12 || photo.size > 716800 || photo.type !== "image/webp") return false;
    const signature = new Uint8Array(await photo.slice(0, 12).arrayBuffer());
    const decoder = new TextDecoder();
    if (decoder.decode(signature.subarray(0, 4)) !== "RIFF" || decoder.decode(signature.subarray(8)) !== "WEBP") return false;

    const { error: uploadError } = await supabase.storage.from("mentor-photos")
      .upload(`${user.id}/avatar.webp`, photo, { contentType: "image/webp", upsert: true });
    if (uploadError) {
      recordMentorOperation("save_profile", "upload_failed", startedAt);
      return false;
    }
    values.photo_version = crypto.randomUUID();
  }

  const { error } = await supabase.from("mentor_profiles").upsert(values, { defaultToNull: false });
  recordMentorOperation("save_profile", error ? "rejected" : "saved", startedAt);
  return !error;
}

export async function getMentorPhoto() {
  const supabase = await createMentorClient();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.storage.from("mentor-photos").download(`${user.id}/avatar.webp`);
  return error ? null : data;
}

function createMentorAdmin() {
  const config = getMentorSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceKey) throw new Error("Mentor portal is unconfigured");
  return createClient<MentorDatabase>(config.url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestMentorCode(email: string, organizationOnly: boolean) {
  const startedAt = performance.now();
  const supabase = await createMentorClient();
  if (!supabase) throw new Error("Mentor portal is unconfigured");

  const { data: allowed, error: checkError } = await createMentorAdmin().rpc("mentor_login_allowed", { target_email: email, organization_only: organizationOnly });
  if (checkError || !allowed) {
    recordMentorOperation("request_code", checkError ? "eligibility_unavailable" : "ineligible", startedAt);
    return;
  }

  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
  recordMentorOperation("request_code", error ? "rejected" : "sent", startedAt);
}

export async function verifyMentorCode(email: string, token: string): Promise<boolean> {
  const startedAt = performance.now();
  const supabase = await createMentorClient();
  if (!supabase) return false;

  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  recordMentorOperation("verify_code", error ? "rejected" : "verified", startedAt);
  return !error && Boolean(data.user);
}

export async function signInWithAccessLink(token: string): Promise<boolean> {
  const startedAt = performance.now();
  const supabase = await createMentorClient();
  if (!supabase || !/^[A-Za-z0-9_-]{43}$/.test(token)) return false;

  const admin = createMentorAdmin();
  const { data: participation } = await admin.from("mentor_participations").select("mentor_id")
    .eq("access_token_hash", hashAccessToken(token)).gt("access_token_expires_at", new Date().toISOString())
    .eq("invitation_drafted", false).maybeSingle();
  if (!participation) {
    recordMentorOperation("link_sign_in", "invalid", startedAt);
    return false;
  }

  const { data: account } = await admin.auth.admin.getUserById(participation.mentor_id);
  const email = account.user?.email;
  const link = email ? await admin.auth.admin.generateLink({ type: "magiclink", email }) : null;
  const tokenHash = link?.data.properties?.hashed_token;
  const { error } = tokenHash ? await supabase.auth.verifyOtp({ type: "email", token_hash: tokenHash }) : { error: true };
  recordMentorOperation("link_sign_in", error ? "rejected" : "verified", startedAt);
  return !error;
}

export async function saveMentorResponse(id: string, response: "confirmed" | "declined", availability: string, fullName: string) {
  const startedAt = performance.now();
  const supabase = await createMentorClient();
  if (!supabase) return false;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("respond_to_mentor_invite", {
    participation_id: id,
    new_response: response,
    new_availability: availability,
    new_full_name: fullName,
  });
  recordMentorOperation("respond", data && !error ? "saved" : "rejected", startedAt);
  return data === true && !error;
}

export async function signOutMentor() {
  const supabase = await createMentorClient();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
}

export async function getMentorDeclaration(id: string, language: "pt" | "en") {
  const startedAt = performance.now();
  const supabase = await createMentorClient();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.storage.from("mentor-certificates").download(`${id}/${language}.pdf`);
  recordMentorOperation("download", error ? "unavailable" : "served", startedAt);
  return error ? null : data;
}
