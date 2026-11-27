"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// The token travels in the URL fragment so it never reaches server logs or Referer headers.
export function InvitationLinkSignIn() {
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = window.location.hash.slice(1);
    window.history.replaceState(null, "", window.location.pathname);

    fetch("/mentores/entrar/sessao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then((response) => (response.ok ? window.location.replace("/mentores") : setFailed(true)))
      .catch(() => setFailed(true));
  }, []);

  if (!failed) return <p role="status" className="text-white/75">Entrando na área de mentores…</p>;

  return (
    <div role="alert" className="grid max-w-sm gap-4 text-center">
      <h1 className="text-2xl font-medium">Este link não vale mais</h1>
      <p className="text-sm leading-relaxed text-white/70">
        O link do convite expira em 30 dias e é trocado quando a organização reenvia o convite. Entre com o e-mail em que recebeu o convite.
      </p>
      <Link href="/mentores" className="mx-auto w-fit rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black hover:bg-white/85">
        Ir para a área de mentores
      </Link>
    </div>
  );
}
