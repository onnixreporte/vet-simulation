-- El diagnóstico correcto suma 50 (o 100 si es raro), así que un turno puede terminar en 150.
alter table public.scores drop constraint if exists scores_points_step_check;
alter table public.scores add constraint scores_points_step_check check (points % 50 = 0);

-- La sala de perros pasó a llamarse sala de mascotas.
update public.cases
set description = replace(description, 'sala de perros', 'sala de mascotas')
where description like '%sala de perros%';

-- Margen de 100 por el paciente que estaba en diagnóstico cuando terminó el turno
-- (ya sumó el diagnóstico pero todavía no cuenta como atendido).
create or replace function public.submit_score(
  p_player_name text,
  p_instagram   text,
  p_vet_name    text,
  p_points      integer,
  p_patients    integer,
  p_owner_idx   smallint default 2,
  p_pet         text default 'perroMarron'
)
returns table (id uuid, rank integer)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_name text := coalesce(nullif(btrim(p_player_name), ''), 'Doc');
  v_vet  text := coalesce(nullif(btrim(p_vet_name), ''), 'Veterinaria Patitas');
  v_ig   text := nullif(btrim(coalesce(p_instagram, '')), '');
  v_key  text;
  v_id   uuid;
begin
  if v_ig is not null and left(v_ig, 1) <> '@' then
    v_ig := '@' || v_ig;
  end if;
  v_key := lower(coalesce(v_ig, v_name || '|' || v_vet));

  -- Por paciente atendido: hasta 100 de diagnóstico + 200 de sala (raro).
  if p_points is null or p_patients is null
     or p_points < 0 or p_patients < 0 or p_patients > 60
     or p_points > p_patients * 300 + 100 then
    raise exception 'Puntaje inválido.' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.scores s
             where s.player_key = v_key and s.created_at > now() - interval '30 seconds') then
    raise exception 'Esperá un momento antes de guardar otro turno.' using errcode = 'P0001';
  end if;

  insert into public.scores (player_name, instagram, vet_name, points, patients, owner_idx, pet)
  values (v_name, v_ig, v_vet, p_points, p_patients, coalesce(p_owner_idx, 2), coalesce(p_pet, 'perroMarron'))
  returning scores.id into v_id;

  return query
  select v_id,
         (select count(*)::integer + 1
          from (select s.player_key, max(s.points) as best from public.scores s group by s.player_key) b
          where b.best > p_points);
end;
$$;
