import type { Metadata } from "next";
import { GuideIdeia } from "@/components/guide/ideia";

export const metadata: Metadata = {
  title: "Sua ideia · Guia do participante · Hack IA Brasil",
  description: "O que esperamos dos times, as tracks e como chegar com o escopo pronto.",
};

export default function Page() {
  return <GuideIdeia />;
}
