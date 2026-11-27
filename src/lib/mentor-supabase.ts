export function getMentorSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ?? process.env.SUPABASE_PUBLISHABLE_KEY
    ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?? process.env.SUPABASE_ANON_KEY;

  return url && key ? { url, key } : null;
}

export const mentorCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

const sessionLifetime = 30 * 24 * 60 * 60;

// @supabase/ssr always writes a 400-day cookie; each refresh rewrites it, so a device is forgotten after 30 days without use.
export function withMentorSessionLifetime<T extends { maxAge?: number }>(options: T): T {
  return options.maxAge ? { ...options, maxAge: Math.min(options.maxAge, sessionLifetime) } : options;
}
