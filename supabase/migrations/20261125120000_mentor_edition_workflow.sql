create table public.mentor_editions (
  name text primary key check (btrim(name) <> ''),
  event_date date,
  hours text,
  venue text,
  address text,
  map_url text
);

insert into public.mentor_editions (name, event_date, hours, venue, address, map_url)
values (
  'Hack IA Brasil 2026', '2026-11-28', '8h às 18h', 'Medway',
  'R. Manoel Gualberto, 255 · Miramar, João Pessoa/PB',
  'https://share.google/I8Q9B6vuIZ3KEXMjA'
);

insert into public.mentor_editions (name)
select distinct edition from public.mentor_participations on conflict (name) do nothing;

alter table public.mentor_participations
  add column invitation_drafted boolean not null default false,
  add column invitation_revision integer not null default 0,
  add column invitation_attempt_started_at timestamptz,
  add column delivery_failed_at timestamptz,
  add constraint mentor_participation_edition_fk foreign key (edition) references public.mentor_editions (name),
  add check (not invitation_drafted or (sent_attempt = 0 and response = 'invited' and verified_at is null));

alter policy "Mentors can read their own participation"
on public.mentor_participations using (mentor_id = (select auth.uid()) and not invitation_drafted);

alter table public.mentor_editions enable row level security;
revoke all on public.mentor_editions from public, anon, authenticated;
grant select on public.mentor_editions to authenticated;
grant all on public.mentor_editions to service_role;
create policy "Mentors can see the editions they were invited to"
on public.mentor_editions for select to authenticated
using (exists (select 1 from public.mentor_participations p
  where p.edition = mentor_editions.name and p.mentor_id = (select auth.uid()) and not p.invitation_drafted));

create or replace view public.mentor_invitation_roster with (security_invoker = false) as
select p.id, p.name, u.email, p.edition, p.response, p.invite_attempt,
       p.sent_attempt, p.invitation_sent_at, p.invitation_drafted, p.invitation_revision,
       p.invitation_attempt_started_at, p.delivery_failed_at, p.verified_at, p.activity,
       p.has_pdf_pt, p.has_pdf_en
from public.mentor_participations p join auth.users u on u.id = p.mentor_id
where u.email is not null;

create function public.mentor_login_allowed(target_email text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where lower(u.email) = target_email and (
      exists (select 1 from public.mentor_organizers o where o.user_id = u.id)
      or exists (select 1 from public.mentor_participations p where p.mentor_id = u.id and not p.invitation_drafted)
    )
  );
$$;
revoke execute on function public.mentor_login_allowed(text) from public, anon, authenticated;
grant execute on function public.mentor_login_allowed(text) to service_role;

create or replace function public.respond_to_mentor_invite(
  participation_id uuid, new_response text, new_availability text
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  normalized_availability text;
begin
  if new_response is null or new_response not in ('confirmed', 'declined') then
    return false;
  end if;
  if new_response = 'confirmed' then
    normalized_availability := nullif(btrim(new_availability), '');
  end if;
  if char_length(normalized_availability) > 500 then
    return false;
  end if;

  update public.mentor_participations
  set responded_at = case
        when response = new_response and availability is not distinct from normalized_availability
          then responded_at
        else now()
      end,
      response = new_response,
      availability = normalized_availability
  where id = participation_id and mentor_id = (select auth.uid())
    and verified_at is null and not invitation_drafted;

  return found;
end;
$$;
