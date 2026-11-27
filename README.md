This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Área de mentores

O endereço `/mentores` serve para confirmar o convite, completar o perfil privado e baixar as declarações assinadas. O botão do e-mail de convite entra direto, sem senha. Sem o link, o mentor entra com um código de seis dígitos enviado ao e-mail convidado. O aparelho fica conectado por 30 dias desde o último uso. Cada pessoa só vê seus registros. `/mentores/convite` redireciona para o mesmo endereço.

O link do convite leva uma chave aleatória depois de `#`, então ela não aparece em logs nem em cabeçalhos `Referer`. O banco guarda só o SHA-256 da chave. O link vale por 30 dias e é trocado a cada reenvio aceito pelo provedor.

O painel `/mentores/organizacao` só envia código a contas listadas em `mentor_organizers`, e o portal só envia a mentores convidados. As duas telas respondem do mesmo jeito para qualquer endereço, sem revelar quem está cadastrado.

### Publicar a área

1. Conecte um projeto Supabase dedicado ao hackathon e aplique os arquivos em `supabase/migrations/` na ordem. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. O painel usa `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor.
2. No Supabase Auth, mantenha o provedor de e-mail ativo, desative novos cadastros e configure o SMTP do remetente oficial. No modelo **Magic Link**, use `{{ .Token }}` no corpo para enviar o código de seis dígitos. Configure expiração de 10 minutos e ajuste os limites de envio ao lote esperado. [Resend SMTP para Supabase Auth](https://resend.com/docs/send-with-supabase-smtp)
3. Conecte o Resend ao projeto para enviar os convites. Configure `RESEND_API_KEY`, `MENTOR_INVITE_FROM` com o remetente verificado e `MENTOR_PORTAL_URL` com a URL HTTPS completa do `/mentores` no domínio oficial. [Resend no Marketplace](https://resend.com/docs/guides/vercel-marketplace-integration)
4. Libere as organizadoras com o script abaixo e confirme que cada uma recebe o código e entra no painel. Envie um convite a um endereço da equipe e teste o botão do e-mail, a resposta, a gravação do perfil, a liberação do PDF e o bloqueio do painel para uma conta de mentor.

### Convidar mentores

Libere cada pessoa da equipe com `node --env-file=/caminho/privado/mentores.env scripts/add-organizer.mjs email@dominio.com`. O script cria a conta sem senha, se ainda não existir, e a adiciona a `mentor_organizers`. Rodar de novo não duplica o acesso. Envie à equipe o link direto `/mentores/organizacao`. A pessoa informa o e-mail autorizado e digita o código recebido. Como novos cadastros ficam desativados, só contas criadas pelo script conseguem entrar. Mantenha a permissão apenas para a equipe que gerencia os convites.

O painel abre na lista do Hack IA Brasil 2026. A programação de 28/11 no Medway já vem preenchida e pode ser ajustada em **Editar dados**. Use **Adicionar mentor** para salvar o nome e o e-mail em um rascunho. Antes da primeira tentativa de envio, você pode corrigir o destinatário. A partir da linha do mentor, revise a prévia e envie. A prévia mostra `link-pessoal` no lugar da chave, que só é gerada no envio. Se o provedor falhar, use **Tentar novamente** na mesma linha.

O mentor pode atualizar o nome de exibição, a foto, o cargo, a empresa, a área de atuação, a bio e o LinkedIn. O perfil e a foto ficam privados. O nome da inscrição continua disponível à organização para a declaração.

Em desenvolvimento, use `MENTOR_LOCAL_MAILPIT_URL` com o endereço HTTP local da caixa Mailpit do Supabase e `MENTOR_PORTAL_URL` com o endereço local do `/mentores`. Os convites de teste aparecem na mesma caixa que os códigos de acesso.

### Importar em lote e publicar declarações

Crie um JSON privado com o rótulo `Hack IA Brasil 2026` para que os convites importados apareçam no painel.

```json
{
  "edition": "Hack IA Brasil 2026",
  "mentors": [{ "email": "mentor@example.com", "name": "Nome do mentor", "role": "Mentor(a)" }]
}
```

O campo `role` é opcional e aceita `Mentor(a)`, `Jurado(a)` ou `Mentor(a) e jurado(a)`.

Execute `node --env-file=/caminho/privado/mentores.env scripts/import-mentors.mjs /caminho/privado/convites.json`. O arquivo de ambiente do operador contém `SUPABASE_URL` e `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`. Guarde a chave e os arquivos de convidados fora do repositório. O importador cria acessos sem senha e preserva dados e respostas dos convites já registrados. Os convites importados aparecem na lista do painel para envio.

Ao confirmar presença, o mentor informa o nome completo como no documento ou passaporte. Esse é o nome da declaração, e o painel mostra quando ele difere do nome do convite.

Depois do evento, abra o registro do mentor no painel e use **Registrar atuação**. Escolha o papel exercido (mentor, jurado ou os dois) e descreva as sessões e as horas registradas. A validação entra na contagem de quem atuou. A confirmação de presença registra o aceite antes do evento.

Na mesma linha, publique a declaração já assinada em PDF, em português ou inglês. O painel aceita um arquivo de até 4 MiB por idioma. Depois da publicação, o mentor pode baixar o arquivo em `/mentores` ou salvar a página com seus registros validados.

Mantenha o domínio e a rota `/mentores` ativos entre edições. Guarde backups do banco e cópias separadas dos PDFs e das fotos privadas. Se um mentor perder o e-mail original, confirme sua identidade e atualize o endereço na mesma conta de autenticação para preservar o histórico.
