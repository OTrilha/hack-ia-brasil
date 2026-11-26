import type { Metadata } from "next";
import { SignupPage } from "@/components/signup-page";

export const metadata: Metadata = {
  title: "Inscrições encerradas · Hack IA Brasil",
  description: "As inscrições para o Hack IA Brasil, 28 de novembro em João Pessoa, foram encerradas em 26/11.",
  alternates: { languages: { "pt-BR": "/inscricao", en: "/en/inscricao" } },
};

export default function Page() {
  return <SignupPage lang="pt" />;
}
