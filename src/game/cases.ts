import type { PetKey } from './sprites'

export type RoomId = 'banos' | 'perros' | 'quirofano' | 'espera'

export interface Case {
  n: string
  pet: PetKey
  esp: string
  edad: string
  raza: string
  color: string
  gen: string
  caso: string
  dice: string
  /** El primer diagnóstico es el correcto; se mezclan al mostrarlos. */
  dx: string[]
  room: RoomId
  raro?: boolean
}

// Por ahora los casos viven acá. Después se cargan desde la tabla `cases` de Supabase.
export const CASES: Case[] = [
  { n: 'Toby', pet: 'perroMarron', esp: 'Perro', edad: '4 años', raza: 'Mestizo', color: 'Marrón', gen: 'Macho',
    caso: 'Se cayó del sillón y no apoya la patita trasera. Llora si lo tocan.', dice: '¡Le duele la patita!',
    dx: ['Fractura: operar', 'Pulgas', 'Está aburrido', 'Comió mucho'], room: 'quirofano' },
  { n: 'Michi', pet: 'gatoCrema', esp: 'Gato', edad: '2 años', raza: 'Siamés', color: 'Crema', gen: 'Hembra',
    caso: 'Se revolcó en el patio, huele terrible y se rasca todo el día.', dice: '¡No se le puede ni acercar!',
    dx: ['Baño antipulgas', 'Fractura', 'Fiebre alta', 'Nada, es así'], room: 'banos' },
  { n: 'Rocky', pet: 'perroNegro', esp: 'Perro', edad: '9 años', raza: 'Labrador', color: 'Negro', gen: 'Macho',
    caso: 'Tiene fiebre desde ayer y no quiere comer. Hay que dejarlo en observación.', dice: 'Está muy decaído...',
    dx: ['Infección: internar', 'Corte de uñas', 'Le falta un baño', 'Celos del gato'], room: 'perros' },
  { n: 'Luna', pet: 'gatoGris', esp: 'Gato', edad: '1 año', raza: 'Común europeo', color: 'Gris', gen: 'Hembra',
    caso: 'Viene a su primera vacuna. Está sana, pero hay tres antes que ella.', dice: '¿Hay mucha fila?',
    dx: ['Control: que espere', 'Cirugía urgente', 'Baño medicado', 'Internación'], room: 'espera' },
  { n: 'Copito', pet: 'perroBlanco', esp: 'Perro', edad: '6 años', raza: 'Caniche', color: 'Blanco', gen: 'Macho',
    caso: 'Tiene el pelo lleno de nudos y abrojos. No ve por dónde camina.', dice: 'Parece un ovillo de lana.',
    dx: ['Baño y corte', 'Fractura', 'Fiebre', 'Alergia a los lunes'], room: 'banos' },
  { n: 'Garfio', pet: 'gatoNaranja', esp: 'Gato', edad: '5 años', raza: 'Atigrado', color: 'Naranja', gen: 'Macho',
    caso: 'Se peleó con otro gato. Tiene una herida profunda en la oreja.', dice: '¡Fue el gato del vecino!',
    dx: ['Herida: suturar', 'Baño', 'Control de rutina', 'Tiene hambre'], room: 'quirofano' },
  { n: 'Coca', pet: 'perroSalchi', esp: 'Perro', edad: '11 años', raza: 'Salchicha', color: 'Marrón', gen: 'Hembra',
    caso: 'Tose de noche. Hay que monitorearla unas horas con oxígeno.', dice: 'Tose igual que mi abuelo.',
    dx: ['Tos: observación', 'Baño', 'Corte de pelo', 'Fractura'], room: 'perros' },
  { n: 'Destello', pet: 'unicornio', esp: 'Unicornio', edad: '312 años', raza: 'Andino', color: 'Blanco arcoíris', gen: 'Hembra', raro: true,
    caso: 'Su cuerno perdió el brillo y ya no hace magia. Tiene barro hasta en la crin.', dice: '¡Es una emergencia mágica!',
    dx: ['Baño con brillantina', 'Fractura de cuerno', 'Modo ahorro', 'Es un caballo disfrazado'], room: 'banos' },
  { n: 'Rex Jr.', pet: 'dino', esp: 'Dinosaurio', edad: '65 millones de años', raza: 'T-Rex', color: 'Verde', gen: 'Macho', raro: true,
    caso: 'Se tragó la pelota del vecino. Y un poco del vecino.', dice: 'Lo encontré así en el patio...',
    dx: ['Cuerpo extraño: operar', 'Baño', 'Gases jurásicos', 'Control de rutina'], room: 'quirofano' },
  { n: 'Pancho', pet: 'elefante', esp: 'Elefante', edad: '23 años', raza: 'Africano', color: 'Gris', gen: 'Macho', raro: true,
    caso: 'Viene a la vacuna anual. No entra en la sala de perros, pero tiene turno.', dice: '¿Dónde lo estaciono?',
    dx: ['Control: que espere', 'Cirugía', 'Baño de barro', 'Internación canina'], room: 'espera' },
]
