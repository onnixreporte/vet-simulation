-- Casos iniciales (los mismos que traía src/game/cases.ts). Solo se cargan si la tabla está vacía.

insert into public.cases (nombre, pet, especie, edad, raza, color, genero, caso, dice, dx, room, raro)
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
  ('Pancho', 'elefante', 'Elefante', '23 años', 'Africano', 'Gris', 'Macho', 'Viene a la vacuna anual. No entra en la sala de perros, pero tiene turno.', '¿Dónde lo estaciono?', array['Control: que espere', 'Cirugía', 'Baño de barro', 'Internación canina'], 'espera', true)
) v(nombre, pet, especie, edad, raza, color, genero, caso, dice, dx, room, raro)
where not exists (select 1 from public.cases);
