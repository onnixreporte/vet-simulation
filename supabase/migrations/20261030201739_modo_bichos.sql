-- Modo secreto "Plaga en la recepción" (se abre escribiendo vetvetvet).
-- Cada modo tiene su propio ranking: turno (el juego normal), infinito y tiempo.
-- En los modos de bichos `patients` guarda los bichos eliminados y `wave` la oleada alcanzada.

alter table public.scores
  add column if not exists mode text not null default 'turno',
  add column if not exists wave smallint not null default 0;

alter table public.scores drop constraint if exists scores_mode_check;
alter table public.scores add constraint scores_mode_check check (mode in ('turno', 'infinito', 'tiempo'));
alter table public.scores drop constraint if exists scores_wave_check;
alter table public.scores add constraint scores_wave_check check (wave between 0 and 1000);

-- El modo infinito no tiene techo de tiempo: se agranda el margen de puntos y de bichos.
alter table public.scores drop constraint if exists scores_points_check;
alter table public.scores add constraint scores_points_check check (points >= 0 and points <= 1000000);
alter table public.scores drop constraint if exists scores_patients_check;
alter table public.scores add constraint scores_patients_check check (patients >= 0 and patients <= 100000);

drop index if exists public.scores_player_key_idx;
create index if not exists scores_player_key_idx on public.scores (mode, player_key, created_at desc);
drop index if exists public.scores_points_idx;
create index if not exists scores_points_idx on public.scores (mode, points desc, created_at);

drop function if exists public.submit_score(text, text, text, integer, integer, smallint, text);
drop function if exists public.top_scores(integer);

-- Guarda una partida y devuelve su id y el puesto entre los mejores de cada jugador en ese modo.
create function public.submit_score(
  p_player_name text,
  p_instagram   text,
  p_vet_name    text,
  p_points      integer,
  p_patients    integer,
  p_owner_idx   smallint default 2,
  p_pet         text default 'perroMarron',
  p_mode        text default 'turno',
  p_wave        integer default 0
)
returns table (id uuid, rank integer)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_name text := coalesce(nullif(btrim(p_player_name), ''), 'Doc');
  v_vet  text := coalesce(nullif(btrim(p_vet_name), ''), 'Veterinaria Patitas');
  v_ig   text := nullif(btrim(coalesce(p_instagram, '')), '');
  v_mode text := coalesce(p_mode, 'turno');
  v_wave integer := coalesce(p_wave, 0);
  v_key  text;
  v_id   uuid;
begin
  if v_ig is not null and left(v_ig, 1) <> '@' then
    v_ig := '@' || v_ig;
  end if;
  v_key := lower(coalesce(v_ig, v_name || '|' || v_vet));

  if p_points is null or p_patients is null or p_points < 0 or p_patients < 0
     or v_mode not in ('turno', 'infinito', 'tiempo') then
    raise exception 'Puntaje inválido.' using errcode = 'P0001';
  end if;

  if v_mode = 'turno' then
    -- Por paciente atendido: hasta 100 de diagnóstico + 200 de sala (raro).
    if p_patients > 60 or p_points > p_patients * 300 + 100 then
      raise exception 'Puntaje inválido.' using errcode = 'P0001';
    end if;
    v_wave := 0;
  else
    -- Cada bicho vale hasta 100 y la reina (una cada 5 oleadas) 500.
    -- La oleada n trae como mucho 4n + 4 bichos, así que hasta la oleada n hay como mucho 2n² + 6n.
    if v_wave < 1 or v_wave > 1000
       or p_patients > 2 * v_wave * v_wave + 6 * v_wave + 10
       or p_points > p_patients * 100 + (v_wave / 5) * 400 then
      raise exception 'Puntaje inválido.' using errcode = 'P0001';
    end if;
  end if;

  if exists (select 1 from public.scores s
             where s.player_key = v_key and s.mode = v_mode and s.created_at > now() - interval '30 seconds') then
    raise exception 'Esperá un momento antes de guardar otra partida.' using errcode = 'P0001';
  end if;

  insert into public.scores (player_name, instagram, vet_name, points, patients, owner_idx, pet, mode, wave)
  values (v_name, v_ig, v_vet, p_points, p_patients, coalesce(p_owner_idx, 2), coalesce(p_pet, 'perroMarron'), v_mode, v_wave)
  returning scores.id into v_id;

  return query
  select v_id,
         (select count(*)::integer + 1
          from (select s.player_key, max(s.points) as best from public.scores s where s.mode = v_mode group by s.player_key) b
          where b.best > p_points);
end;
$$;

-- Mejor partida de cada jugador en un modo, de mayor a menor.
create function public.top_scores(lim integer default 10, p_mode text default 'turno')
returns table (id uuid, player_name text, instagram text, vet_name text, points integer, owner_idx smallint, pet text)
language sql stable security definer set search_path = ''
as $$
  select b.id, b.player_name, b.instagram, b.vet_name, b.points, b.owner_idx, b.pet
  from (
    select distinct on (s.player_key) s.*
    from public.scores s
    where s.mode = coalesce(p_mode, 'turno')
    order by s.player_key, s.points desc, s.created_at
  ) b
  order by b.points desc, b.created_at
  limit least(greatest(coalesce(lim, 10), 1), 50);
$$;

revoke all on function public.submit_score(text, text, text, integer, integer, smallint, text, text, integer) from public;
revoke all on function public.top_scores(integer, text) from public;
grant execute on function public.submit_score(text, text, text, integer, integer, smallint, text, text, integer) to anon, authenticated;
grant execute on function public.top_scores(integer, text) to anon, authenticated;
