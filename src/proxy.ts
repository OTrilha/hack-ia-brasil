import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getMentorSupabaseConfig, mentorCookieOptions, withMentorSessionLifetime } from "./lib/mentor-supabase";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseConfig = getMentorSupabaseConfig();

  if (supabaseConfig) {
    const supabase = createServerClient(supabaseConfig.url, supabaseConfig.key, {
      cookieOptions: mentorCookieOptions,
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, withMentorSessionLifetime(options));
          for (const [name, value] of Object.entries(headers ?? {})) response.headers.set(name, value);
        },
      },
    });
    await supabase.auth.getClaims();
  }

  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = { matcher: "/mentores/:path*" };
