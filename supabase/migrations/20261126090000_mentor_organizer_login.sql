drop function public.mentor_login_allowed(text);

create function public.mentor_login_allowed(target_email text, organization_only boolean default false)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where lower(u.email) = target_email and (
      exists (select 1 from public.mentor_organizers o where o.user_id = u.id)
      or (not organization_only and exists (
        select 1 from public.mentor_participations p where p.mentor_id = u.id and not p.invitation_drafted
      ))
    )
  );
$$;
revoke execute on function public.mentor_login_allowed(text, boolean) from public, anon, authenticated;
grant execute on function public.mentor_login_allowed(text, boolean) to service_role;
