import type { Metadata } from "next";
import { GuideHub } from "@/components/guide/hub";

export const metadata: Metadata = {
  title: "Guia do participante · Hack IA Brasil",
  description: "Checklist, o evento em resumo e tudo o que você precisa para chegar preparado no Hack IA Brasil.",
};

export default function Page() {
  return <GuideHub />;
}
