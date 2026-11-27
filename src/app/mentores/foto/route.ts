import { getMentorPhoto } from "@/lib/mentors";

export async function GET() {
  const photo = await getMentorPhoto();
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex, nofollow",
    "X-Content-Type-Options": "nosniff",
  };
  if (!photo) return new Response(null, { status: 404, headers });
  return new Response(photo, { headers: { ...headers, "Content-Type": "image/webp" } });
}
