import { createClient } from "@supabase/supabase-js";

const [input] = process.argv.slice(2);
const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!input || !url || !key) {
  throw new Error("Informe o e-mail e configure SUPABASE_URL e SUPABASE_SECRET_KEY.");
}

const email = input.trim().toLowerCase();
if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("E-mail inválido.");
}

const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let userId = (await supabase.rpc("mentor_account_id", { target_email: email })).data;
if (!userId) {
  const { data, error } = await supabase.auth.admin.createUser({ email, email_confirm: true });
  if (error || !data.user) throw new Error("Não foi possível criar a conta da organizadora.");
  userId = data.user.id;
}

const { error } = await supabase.from("mentor_organizers").upsert({ user_id: userId }, { ignoreDuplicates: true });
if (error) throw new Error("Não foi possível liberar o acesso ao painel.");

console.log(`${email} pode entrar em /mentores/organizacao.`);
