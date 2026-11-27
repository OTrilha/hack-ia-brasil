update public.mentor_participations set role = 'Mentor(a)'
where role not in ('Mentor(a)', 'Jurado(a)', 'Mentor(a) e jurado(a)');

alter table public.mentor_participations
  add column full_name text check (char_length(btrim(full_name)) between 1 and 200 and full_name !~ '[\r\n]'),
  add constraint mentor_participation_role_check check (role in ('Mentor(a)', 'Jurado(a)', 'Mentor(a) e jurado(a)'));

create or replace view public.mentor_invitation_roster with (security_invoker = false) as
select p.id, p.name, u.email, p.edition, p.response, p.invite_attempt,
       p.sent_attempt, p.invitation_sent_at, p.invitation_drafted, p.invitation_revision,
       p.invitation_attempt_started_at, p.delivery_failed_at, p.verified_at, p.activity,
       p.has_pdf_pt, p.has_pdf_en, p.full_name, p.role
from public.mentor_participations p join auth.users u on u.id = p.mentor_id
where u.email is not null;

drop function public.respond_to_mentor_invite(uuid, text, text);

-- The declaration uses full_name, so confirming requires the mentor to state it.
create function public.respond_to_mentor_invite(
  participation_id uuid, new_response text, new_availability text, new_full_name text
)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  normalized_availability text;
  normalized_full_name text;
begin
  if new_response is null or new_response not in ('confirmed', 'declined') then
    return false;
  end if;
  if new_response = 'confirmed' then
    normalized_availability := nullif(btrim(new_availability), '');
    normalized_full_name := nullif(btrim(new_full_name), '');
    if normalized_full_name is null or char_length(normalized_full_name) > 200 or normalized_full_name ~ '[\r\n]' then
      return false;
    end if;
  end if;
  if char_length(normalized_availability) > 500 then
    return false;
  end if;

  update public.mentor_participations
  set responded_at = case
        when response = new_response and availability is not distinct from normalized_availability
          and (normalized_full_name is null or full_name is not distinct from normalized_full_name)
          then responded_at
        else now()
      end,
      response = new_response,
      availability = normalized_availability,
      full_name = coalesce(normalized_full_name, full_name)
  where id = participation_id and mentor_id = (select auth.uid())
    and verified_at is null and not invitation_drafted;

  return found;
end;
$$;

revoke execute on function public.respond_to_mentor_invite(uuid, text, text, text) from public, anon;
grant execute on function public.respond_to_mentor_invite(uuid, text, text, text) to authenticated;
