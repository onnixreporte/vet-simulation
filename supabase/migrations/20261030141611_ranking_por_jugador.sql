-- Ranking por jugador y cierre de accesos.
-- El cliente (clave anon / publishable) lee casos activos de `cases`
-- y usa solo submit_score() y top_scores() para el ranking.

-- ---------------------------------------------------------------- casos

alter table public.cases drop constraint if exists cases_pet_check;
alter table public.cases add constraint cases_pet_check check (pet in (
  'perroMarron','perroNegro','perroBlanco','perroSalchi',
  'gatoCrema','gatoGris','gatoNaranja','unicornio','dino','elefante'));

-- Solo lectura desde el juego; las altas se hacen desde el panel o con la clave de servicio.
revoke insert, update, delete, truncate, references, trigger on public.cases from anon, authenticated;

-- ---------------------------------------------------------------- ranking

-- Dueño y mascota que se dibujan en el podio.
alter table public.scores
  add column if not exists owner_idx smallint not null default 2,
  add column if not exists pet text not null default 'perroMarron';

alter table public.scores drop constraint if exists scores_owner_idx_check;
alter table public.scores add constraint scores_owner_idx_check check (owner_idx between 0 and 7);
alter table public.scores drop constraint if exists scores_pet_check;
alter table public.scores add constraint scores_pet_check check (pet in (
  'perroMarron','perroNegro','perroBlanco','perroSalchi',
  'gatoCrema','gatoGris','gatoNaranja','unicornio','dino','elefante'));
-- Cada paciente da 100 (o 200 si es raro).
alter table public.scores drop constraint if exists scores_points_step_check;
alter table public.scores add constraint scores_points_step_check check (points % 100 = 0);

-- Identifica al jugador para quedarse con su mejor turno: el IG si lo puso, si no nombre + vete.
alter table public.scores
  add column if not exists player_key text generated always as (
    lower(coalesce(instagram, player_name || '|' || vet_name))) stored;

create index if not exists scores_player_key_idx on public.scores (player_key, created_at desc);
drop index if exists public.scores_points_idx;
create index if not exists scores_points_idx on public.scores (points desc, created_at);

-- Sin acceso directo: se lee y se escribe solo por las funciones.
drop policy if exists "ranking visible para todos" on public.scores;
revoke all on public.scores from anon, authenticated;

drop function if exists public.submit_score(text, text, text, integer, integer);

-- Guarda un turno y devuelve su id y el puesto que ocupa entre los mejores de cada jugador.
create function public.submit_score(
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

  -- Un turno dura 90 s: ni 60 pacientes ni más de 300 puntos por paciente.
  if p_points is null or p_patients is null
     or p_points < 0 or p_patients < 0 or p_patients > 60
     or p_points > p_patients * 300 then
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

-- Mejor turno de cada jugador, de mayor a menor.
create or replace function public.top_scores(lim integer default 10)
returns table (id uuid, player_name text, instagram text, vet_name text, points integer, owner_idx smallint, pet text)
language sql stable security definer set search_path = ''
as $$
  select b.id, b.player_name, b.instagram, b.vet_name, b.points, b.owner_idx, b.pet
  from (
    select distinct on (s.player_key) s.*
    from public.scores s
    order by s.player_key, s.points desc, s.created_at
  ) b
  order by b.points desc, b.created_at
  limit least(greatest(coalesce(lim, 10), 1), 50);
$$;

revoke all on function public.submit_score(text, text, text, integer, integer, smallint, text) from public;
revoke all on function public.top_scores(integer) from public;
grant execute on function public.submit_score(text, text, text, integer, integer, smallint, text) to anon, authenticated;
grant execute on function public.top_scores(integer) to anon, authenticated;
