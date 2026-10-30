-- Esquema inicial tal como está aplicado en vetsafe (reconstruido desde la base el 2026-10-30).

create table if not exists public.cases (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pet         text not null,
  species     text not null,
  age         text not null,
  breed       text not null,
  color       text not null,
  gender      text not null,
  description text not null,
  owner_says  text not null,
  -- El primero es el diagnóstico correcto; el juego los mezcla al mostrarlos.
  diagnoses   text[] not null check (array_length(diagnoses, 1) >= 2 and array_length(diagnoses, 1) <= 4),
  room        text not null check (room = any (array['banos', 'perros', 'quirofano', 'espera'])),
  rare        boolean not null default false,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
alter table public.cases enable row level security;
create policy "casos activos visibles para todos" on public.cases for select to anon, authenticated using (active);

create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) >= 1 and char_length(player_name) <= 24),
  instagram   text check (instagram is null or instagram ~ '^@[A-Za-z0-9._]{1,30}$'),
  vet_name    text not null check (char_length(vet_name) >= 1 and char_length(vet_name) <= 30),
  points      integer not null check (points >= 0 and points <= 100000),
  patients    integer not null check (patients >= 0 and patients <= 500),
  created_at  timestamptz not null default now()
);
create index if not exists scores_points_idx on public.scores (points desc);
alter table public.scores enable row level security;
create policy "ranking visible para todos" on public.scores for select to anon, authenticated using (true);

create or replace function public.submit_score(p_player_name text, p_instagram text, p_vet_name text, p_points integer, p_patients integer)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare
  v_id uuid;
  v_ig text := nullif(trim(p_instagram), '');
begin
  if p_points < 0 or p_patients < 0 or p_patients > 60 then
    raise exception 'puntaje inválido';
  end if;
  if p_points > p_patients * 300 then
    raise exception 'puntaje inválido';
  end if;
  if exists (
    select 1 from public.scores
    where lower(player_name) = lower(trim(p_player_name))
      and lower(vet_name) = lower(trim(p_vet_name))
      and created_at > now() - interval '20 seconds'
  ) then
    raise exception 'esperá un momento antes de guardar otro puntaje';
  end if;
  insert into public.scores (player_name, instagram, vet_name, points, patients)
  values (trim(p_player_name), v_ig, trim(p_vet_name), p_points, p_patients)
  returning id into v_id;
  return v_id;
end;
$$;

-- Casos iniciales, solo si la tabla está vacía.
insert into public.cases (name, pet, species, age, breed, color, gender, description, owner_says, diagnoses, room, rare)
select * from (values
  ('Toby', 'perroMarron', 'Perro', '4 años', 'Mestizo', 'Marrón', 'Macho', 'Se cayó del sillón y no apoya la patita trasera. Llora si lo tocan.', '¡Le duele la patita!', array['Fractura: operar', 'Pulgas', 'Está aburrido', 'Comió mucho'], 'quirofano', false),
  ('Michi', 'gatoCrema', 'Gato', '2 años', 'Siamés', 'Crema', 'Hembra', 'Se revolcó en el patio, huele terrible y se rasca todo el día.', '¡No se le puede ni acercar!', array['Baño antipulgas', 'Fractura', 'Fiebre alta', 'Nada, es así'], 'banos', false),
  ('Rocky', 'perroNegro', 'Perro', '9 años', 'Labrador', 'Negro', 'Macho', 'Tiene fiebre desde ayer y no quiere comer. Hay que dejarlo en observación.', 'Está muy decaído...', array['Infección: internar', 'Corte de uñas', 'Le falta un baño', 'Celos del gato'], 'perros', false),
  ('Luna', 'gatoGris', 'Gato', '1 año', 'Común europeo', 'Gris', 'Hembra', 'Viene a su primera vacuna. Está sana, pero hay tres antes que ella.', '¿Hay mucha fila?', array['Control: que espere', 'Cirugía urgente', 'Baño medicado', 'Internación'], 'espera', false),
  ('Copito', 'perroBlanco', 'Perro', '6 años', 'Caniche', 'Blanco', 'Macho', 'Tiene el pelo lleno de nudos y abrojos. No ve por dónde camina.', 'Parece un ovillo de lana.', array['Baño y corte', 'Fractura', 'Fiebre', 'Alergia a los lunes'], 'banos', false),
  ('Garfio', 'gatoNaranja', 'Gato', '5 años', 'Atigrado', 'Naranja', 'Macho', 'Se peleó con otro gato. Tiene una herida profunda en la oreja.', '¡Fue el gato del vecino!', array['Herida: suturar', 'Baño', 'Control de rutina', 'Tiene hambre'], 'quirofano', false),
  ('Coca', 'perroSalchi', 'Perro', '11 años', 'Salchicha', 'Marrón', 'Hembra', 'Tose de noche. Hay que monitorearla unas horas con oxígeno.', 'Tose igual que mi abuelo.', array['Tos: observación', 'Baño', 'Corte de pelo', 'Fractura'], 'perros', false),
  ('Destello', 'unicornio', 'Unicornio', '312 años', 'Andino', 'Blanco arcoíris', 'Hembra', 'Su cuerno perdió el brillo y ya no hace magia. Tiene barro hasta en la crin.', '¡Es una emergencia mágica!', array['Baño con brillantina', 'Fractura de cuerno', 'Modo ahorro', 'Es un caballo disfrazado'], 'banos', true),
  ('Rex Jr.', 'dino', 'Dinosaurio', '65 millones de años', 'T-Rex', 'Verde', 'Macho', 'Se tragó la pelota del vecino. Y un poco del vecino.', 'Lo encontré así en el patio...', array['Cuerpo extraño: operar', 'Baño', 'Gases jurásicos', 'Control de rutina'], 'quirofano', true),
  ('Pancho', 'elefante', 'Elefante', '23 años', 'Africano', 'Gris', 'Macho', 'Viene a la vacuna anual. No entra en la sala de mascotas, pero tiene turno.', '¿Dónde lo estaciono?', array['Control: que espere', 'Cirugía', 'Baño de barro', 'Internación canina'], 'espera', true)
) v(name, pet, species, age, breed, color, gender, description, owner_says, diagnoses, room, rare)
where not exists (select 1 from public.cases);
