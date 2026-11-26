import type { Metadata } from "next";
import { GuideDia } from "@/components/guide/dia";

export const metadata: Metadata = {
  title: "O dia · Guia do participante · Hack IA Brasil",
  description: "Programação, regras, o que levar, submissão, critérios, pitch, premiação e perguntas frequentes.",
};

export default function Page() {
  return <GuideDia />;
}
