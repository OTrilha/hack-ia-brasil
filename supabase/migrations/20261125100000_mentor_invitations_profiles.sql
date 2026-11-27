create table public.mentor_organizers (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.mentor_organizers enable row level security;
revoke all on public.mentor_organizers from public, anon, authenticated;
grant select on public.mentor_organizers to authenticated;
grant all on public.mentor_organizers to service_role;
create policy "Organizers can check their own access"
on public.mentor_organizers for select to authenticated
using (user_id = (select auth.uid()));

alter table public.mentor_participations
  add column invite_attempt integer not null default 1,
  add column sent_attempt integer not null default 0,
  add column invitation_sent_at timestamptz,
  add column invitation_claim_id uuid,
  add column invitation_claimed_at timestamptz,
  add check (invite_attempt > 0 and sent_attempt between 0 and invite_attempt),
  add check ((invitation_claim_id is null) = (invitation_claimed_at is null)),
  add check ((sent_attempt = 0) = (invitation_sent_at is null));

create function public.mentor_account_id(target_email text)
returns uuid language sql stable set search_path = ''
as $$
  select id from auth.users where lower(email) = target_email limit 1;
$$;
-- The function needs access to auth.users, and only the server can call it.
alter function public.mentor_account_id(text) security definer;
revoke execute on function public.mentor_account_id(text) from public, anon, authenticated;
grant execute on function public.mentor_account_id(text) to service_role;

create view public.mentor_invitation_roster with (security_invoker = false) as
select p.id, p.name, u.email, p.edition, p.response, p.invite_attempt,
       p.sent_attempt, p.invitation_sent_at
from public.mentor_participations p join auth.users u on u.id = p.mentor_id
where u.email is not null;
revoke all on public.mentor_invitation_roster from public, anon, authenticated;
grant select on public.mentor_invitation_roster to service_role;

create table public.mentor_profiles (
  mentor_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 120),
  title text check (char_length(title) <= 100),
  company text check (char_length(company) <= 100),
  specialty text check (char_length(specialty) <= 100),
  bio text check (char_length(bio) <= 500),
  linkedin_url text check (char_length(linkedin_url) <= 300 and linkedin_url ~ '^https://([a-zA-Z0-9-]+\.)*linkedin\.com/'),
  photo_version uuid
);
alter table public.mentor_profiles enable row level security;
revoke all on public.mentor_profiles from public, anon, authenticated;
grant select, insert, update on public.mentor_profiles to authenticated;
grant all on public.mentor_profiles to service_role;
create policy "Mentors can edit their own profile"
on public.mentor_profiles for all to authenticated
using (mentor_id = (select auth.uid()))
with check (
  mentor_id = (select auth.uid())
  and exists (select 1 from public.mentor_participations p where p.mentor_id = mentor_profiles.mentor_id)
);

insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('mentor-photos', 'mentor-photos', false, array['image/webp'], 716800);

create policy "Mentors can manage their own profile photo"
on storage.objects for all to authenticated
using (bucket_id = 'mentor-photos' and name = (select auth.uid())::text || '/avatar.webp')
with check (
  bucket_id = 'mentor-photos'
  and name = (select auth.uid())::text || '/avatar.webp'
  and exists (select 1 from public.mentor_participations p where p.mentor_id = (select auth.uid()))
);
