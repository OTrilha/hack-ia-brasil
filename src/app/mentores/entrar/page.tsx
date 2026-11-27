import type { Metadata } from "next";
import { InvitationLinkSignIn } from "./link-sign-in";

export const metadata: Metadata = {
  title: "Entrando | Hack IA Brasil",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function MentorLinkPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-black px-5 text-white">
      <InvitationLinkSignIn />
    </main>
  );
}
