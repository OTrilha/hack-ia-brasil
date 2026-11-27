create table public.mentor_participations (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references auth.users (id) on delete restrict,
  edition text not null check (btrim(edition) <> ''),
  name text not null check (btrim(name) <> ''),
  role text not null default 'Mentor(a)' check (btrim(role) <> ''),
  response text not null default 'invited' check (response in ('invited', 'confirmed', 'declined')),
  availability text check (char_length(availability) <= 500),
  responded_at timestamptz,
  verified_at timestamptz,
  activity text,
  has_pdf_pt boolean not null default false,
  has_pdf_en boolean not null default false,
  unique (mentor_id, edition),
  check ((response = 'invited') = (responded_at is null)),
  check (response = 'confirmed' or availability is null),
  check (case when verified_at is null then activity is null else nullif(btrim(activity), '') is not null end),
  check (verified_at is not null or not (has_pdf_pt or has_pdf_en))
);

alter table public.mentor_participations enable row level security;
revoke all on public.mentor_participations from public, anon, authenticated;
grant select on public.mentor_participations to authenticated;
grant all on public.mentor_participations to service_role;

create policy "Mentors can read their own participation"
on public.mentor_participations for select to authenticated
using (mentor_id = (select auth.uid()));

create function public.respond_to_mentor_invite(
  participation_id uuid,
  new_response text,
  new_availability text
)
returns boolean
language plpgsql
security definer
set search_path = ''
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
  where id = participation_id
    and mentor_id = (select auth.uid())
    and verified_at is null;

  return found;
end;
$$;

revoke execute on function public.respond_to_mentor_invite(uuid, text, text) from public, anon;
grant execute on function public.respond_to_mentor_invite(uuid, text, text) to authenticated;

insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('mentor-certificates', 'mentor-certificates', false, array['application/pdf'], 10485760);

create policy "Mentors can download their own released declarations"
on storage.objects for select to authenticated
using (
  bucket_id = 'mentor-certificates'
  and exists (
    select 1
    from public.mentor_participations as participation
    where participation.mentor_id = (select auth.uid())
      and participation.verified_at is not null
      and (
        (participation.has_pdf_pt and storage.objects.name = participation.id::text || '/pt.pdf')
        or (participation.has_pdf_en and storage.objects.name = participation.id::text || '/en.pdf')
      )
  )
);
