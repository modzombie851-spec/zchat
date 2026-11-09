do $u$
declare r record; n int := 0;
begin
  if to_regclass('zchat_private.moved_functions') is null then raise notice 'nothing to undo'; return; end if;
  for r in select name, args from zchat_private.moved_functions loop
    begin
      if exists (select 1 from pg_proc p where p.pronamespace = 'zchat_private'::regnamespace and p.proname = r.name and pg_get_function_identity_arguments(p.oid) = r.args)
         and not exists (select 1 from pg_proc p where p.pronamespace = 'public'::regnamespace and p.proname = r.name and pg_get_function_identity_arguments(p.oid) = r.args) then
        execute format('alter function zchat_private.%I(%s) set schema public', r.name, r.args);
        n := n + 1;
      end if;
      delete from zchat_private.moved_functions where name = r.name and args = r.args;
    exception when others then raise notice 'could not move back %(%): %', r.name, r.args, sqlerrm;
    end;
  end loop;
  raise notice 'moved % functions back to public', n;
end $u$;
drop event trigger if exists zchat_sync_twin;
notify pgrst, 'reload schema';
