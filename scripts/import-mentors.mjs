import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const [file] = process.argv.slice(2);
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!file || !url || !key) {
  throw new Error("Informe o arquivo JSON e configure SUPABASE_URL e SUPABASE_SECRET_KEY.");
}

const roles = new Set(["Mentor(a)", "Jurado(a)", "Mentor(a) e jurado(a)"]);

function requiredText(value, field, maxLength) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
    throw new Error(`Campo inválido: ${field}.`);
  }
  return value.trim();
}

const input = JSON.parse(await readFile(file, "utf8"));
const edition = requiredText(input.edition, "edição", 120);
if (!Array.isArray(input.mentors) || !input.mentors.length) {
  throw new Error("Informe pelo menos um mentor na lista.");
}

const mentors = input.mentors.map(({ email, name, role }, index) => {
  const address = requiredText(email, `e-mail da linha ${index + 1}`, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw new Error(`E-mail inválido na linha ${index + 1}.`);
  }
  const mentorRole = role ?? "Mentor(a)";
  if (!roles.has(mentorRole)) throw new Error(`Papel inválido na linha ${index + 1}. Use ${[...roles].join(", ")}.`);
  return {
    email: address,
    name: requiredText(name, `nome da linha ${index + 1}`, 200),
    role: mentorRole,
  };
});
if (new Set(mentors.map(({ email }) => email)).size !== mentors.length) {
  throw new Error("Há e-mails repetidos no arquivo de convites.");
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const editionResult = await supabase.from("mentor_editions").upsert({ name: edition }, { ignoreDuplicates: true });
if (editionResult.error) throw new Error("Não foi possível registrar a edição do evento.");
const existingUsers = new Map();
const perPage = 200;
let page = 1;
while (page) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
  if (error) throw new Error("Não foi possível carregar os usuários do Supabase.");
  for (const user of data.users) {
    if (user.email) existingUsers.set(user.email.toLowerCase(), user.id);
  }
  page = data.users.length === perPage ? page + 1 : 0;
}

for (const [index, mentor] of mentors.entries()) {
  let mentorId = existingUsers.get(mentor.email);
  if (!mentorId) {
    const { data, error } = await supabase.auth.admin.createUser({ email: mentor.email, email_confirm: true });
    if (error || !data.user) throw new Error(`Não foi possível criar o acesso da linha ${index + 1}.`);
    mentorId = data.user.id;
  }

  const { error } = await supabase.from("mentor_participations").upsert({
    mentor_id: mentorId,
    edition,
    name: mentor.name,
    role: mentor.role,
  }, { onConflict: "mentor_id,edition", ignoreDuplicates: true });
  if (error) throw new Error(`Não foi possível registrar o convite da linha ${index + 1}.`);
}

console.log(`${mentors.length} convites registrados ou já existentes para ${edition}.`);
