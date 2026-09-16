-- Security advisor flagged public.handle_new_mission_hunt_user() as a
-- SECURITY DEFINER function directly callable by anon/authenticated via
-- /rest/v1/rpc/handle_new_mission_hunt_user. It is exclusively the
-- on_auth_user_created_mission_hunt trigger body (see 0001_mission_hunt.sql)
-- — it should only ever run as a side effect of a new auth.users row, never
-- as a direct client call. Revoking EXECUTE here does not affect the
-- trigger: Postgres trigger invocation runs as part of the INSERT on
-- auth.users (performed by Supabase Auth's own service role), not via the
-- calling session's own EXECUTE privilege on the function.
revoke execute on function public.handle_new_mission_hunt_user() from public;
revoke execute on function public.handle_new_mission_hunt_user() from anon;
revoke execute on function public.handle_new_mission_hunt_user() from authenticated;
