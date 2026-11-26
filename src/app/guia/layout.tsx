import { GuideShell } from "@/components/guide/shell";

export default function GuiaLayout({ children }: LayoutProps<"/guia">) {
  return <GuideShell>{children}</GuideShell>;
}
