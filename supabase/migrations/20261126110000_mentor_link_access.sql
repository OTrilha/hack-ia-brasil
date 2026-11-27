-- The invitation link carries a random token; only its SHA-256 is stored.
alter table public.mentor_participations
  add column access_token_hash text unique check (access_token_hash ~ '^[a-f0-9]{64}$'),
  add column access_token_expires_at timestamptz,
  add check ((access_token_hash is null) = (access_token_expires_at is null));

-- The panel sends codes only to organizers, and the portal only to invited mentors.
create or replace function public.mentor_login_allowed(target_email text, organization_only boolean default false)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where lower(u.email) = target_email and case
      when organization_only then exists (select 1 from public.mentor_organizers o where o.user_id = u.id)
      else exists (select 1 from public.mentor_participations p where p.mentor_id = u.id and not p.invitation_drafted)
    end
  );
$$;
