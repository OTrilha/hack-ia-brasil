import type { Metadata } from "next";
import { SignupPage } from "@/components/signup-page";

export const metadata: Metadata = {
  title: "Applications closed · Hack IA Brasil",
  description: "Applications for Hack IA Brasil, November 28 in João Pessoa, closed on November 26.",
  alternates: { languages: { "pt-BR": "/inscricao", en: "/en/inscricao" } },
};

export default function Page() {
  return <SignupPage lang="en" />;
}
