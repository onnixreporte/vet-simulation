-- ¡Siguiente Paciente!: casos clínicos y ranking.
-- El cliente solo usa la clave pública (anon / publishable):
--   * lee casos activos directo de la tabla `cases`
--   * nunca toca `scores` directo: guarda con submit_score() y lee con top_scores()

-- ---------------------------------------------------------------- casos

create table if not exists public.cases (
  id          bigint generated always as identity primary key,
  nombre      text    not null check (char_length(nombre) between 1 and 40),
  pet         text    not null check (pet in (
                'perroMarron','perroNegro','perroBlanco','perroSalchi',
                'gatoCrema','gatoGris','gatoNaranja','unicornio','dino','elefante')),
  especie     text    not null,
  edad        text    not null,
  raza        text    not null,
  color       text    not null,
  genero      text    not null,
  caso        text    not null check (char_length(caso) <= 200),
  dice        text    not null check (char_length(dice) <= 80),
  -- El primero es el diagnóstico correcto; el juego los mezcla al mostrarlos.
  dx          text[]  not null check (cardinality(dx) between 2 and 4),
  room        text    not null check (room in ('banos','perros','quirofano','espera')),
  raro        boolean not null default false,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.cases enable row level security;

drop policy if exists "casos activos visibles" on public.cases;
create policy "casos activos visibles" on public.cases
  for select to anon, authenticated
  using (activo);

grant select on public.cases to anon, authenticated;

-- ---------------------------------------------------------------- ranking

create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  nombre      text     not null check (char_length(nombre) between 1 and 24),
  ig          text     not null default '' check (ig = '' or ig ~ '^@[A-Za-z0-9._]{1,30}$'),
  vet         text     not null check (char_length(vet) between 1 and 30),
  puntos      integer  not null check (puntos between 0 and 10000 and puntos % 100 = 0),
  owner_idx   smallint not null default 2 check (owner_idx between 0 and 7),
  pet         text     not null default 'perroMarron' check (pet in (
                'perroMarron','perroNegro','perroBlanco','perroSalchi',
                'gatoCrema','gatoGris','gatoNaranja','unicornio','dino','elefante')),
  -- Identifica al jugador para quedarse con su mejor turno: el IG si lo puso, si no nombre + vete.
  jugador     text     generated always as (
                lower(case when ig <> '' then ig else nombre || '|' || vet end)) stored,
  created_at  timestamptz not null default now()
);

create index if not exists scores_puntos_idx on public.scores (puntos desc, created_at);
create index if not exists scores_jugador_idx on public.scores (jugador, created_at desc);

-- RLS activo y sin políticas: nadie accede a la tabla directo, solo por las funciones.
alter table public.scores enable row level security;
revoke all on public.scores from anon, authenticated;

-- Mejor puntaje de cada jugador, ordenado.
create or replace function public.top_scores(lim integer default 10)
returns table (id bigint, nombre text, ig text, vet text, puntos integer, owner_idx smallint, pet text)
language sql stable security definer set search_path = ''
as $$
  select b.id, b.nombre, b.ig, b.vet, b.puntos, b.owner_idx, b.pet
  from (
    select distinct on (s.jugador) s.*
    from public.scores s
    order by s.jugador, s.puntos desc, s.created_at
  ) b
  order by b.puntos desc, b.created_at
  limit least(greatest(lim, 1), 50);
$$;

-- Guarda un turno y devuelve su id y el puesto que ocupa entre los mejores de cada jugador.
create or replace function public.submit_score(
  p_nombre text, p_ig text, p_vet text, p_puntos integer,
  p_owner_idx smallint default 2, p_pet text default 'perroMarron'
)
returns table (id bigint, puesto integer)
language plpgsql volatile security definer set search_path = ''
as $$
declare
  v_ig      text := btrim(coalesce(p_ig, ''));
  v_jugador text;
  v_id      bigint;
begin
  if v_ig <> '' and left(v_ig, 1) <> '@' then
    v_ig := '@' || v_ig;
  end if;
  v_jugador := lower(case when v_ig <> '' then v_ig
                     else coalesce(nullif(btrim(p_nombre), ''), 'Doc') || '|' || coalesce(nullif(btrim(p_vet), ''), 'Veterinaria Patitas') end);

  -- Un turno dura 90 s: más de un guardado cada 30 s por jugador no es una partida real.
  if exists (select 1 from public.scores s
             where s.jugador = v_jugador and s.created_at > now() - interval '30 seconds') then
    raise exception 'Esperá un momento antes de guardar otro turno.' using errcode = 'P0001';
  end if;

  insert into public.scores (nombre, ig, vet, puntos, owner_idx, pet)
  values (
    coalesce(nullif(btrim(p_nombre), ''), 'Doc'),
    v_ig,
    coalesce(nullif(btrim(p_vet), ''), 'Veterinaria Patitas'),
    p_puntos,
    coalesce(p_owner_idx, 2),
    coalesce(p_pet, 'perroMarron')
  )
  returning scores.id into v_id;

  return query
  select v_id,
         (select count(*)::integer + 1
          from (select s.jugador, max(s.puntos) as mejor from public.scores s group by s.jugador) m
          where m.mejor > p_puntos);
end;
$$;

revoke all on function public.top_scores(integer) from public;
revoke all on function public.submit_score(text, text, text, integer, smallint, text) from public;
grant execute on function public.top_scores(integer) to anon, authenticated;
grant execute on function public.submit_score(text, text, text, integer, smallint, text) to anon, authenticated;
