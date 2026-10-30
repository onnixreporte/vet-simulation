import type { PetKey } from '../game/sprites'

export interface Score {
  n: string
  ig: string
  v: string
  p: number
  /** índice del dueño y mascota que se muestran en el podio */
  o: number
  pet: PetKey
  me?: boolean
}

// Datos de ejemplo hasta conectar la tabla `scores` de Supabase.
const SAMPLE: Score[] = [
  { n: 'Dra. Sofía', ig: '@sofi.vet', v: 'Veterinaria Patitas', p: 2450, o: 5, pet: 'gatoCrema' },
  { n: 'Marcos', ig: '@marcos_vet', v: 'Clínica Huellitas', p: 2100, o: 1, pet: 'perroNegro' },
  { n: 'Lucía', ig: '@luvet', v: 'Vet San Roque', p: 1880, o: 0, pet: 'unicornio' },
  { n: 'Diego', ig: '@dieguito.dvm', v: 'Centro Animal', p: 1520, o: 3, pet: 'perroMarron' },
  { n: 'Ana', ig: '@ana.mascotas', v: 'Patas y Colas', p: 1240, o: 4, pet: 'gatoGris' },
  { n: 'Pedro', ig: '@pedrovet', v: 'Vet del Barrio', p: 980, o: 6, pet: 'dino' },
]
const KEY = 'sp-scores'

function readLocal(): Score[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export async function saveScore(s: Score): Promise<void> {
  try {
    localStorage.setItem(KEY, JSON.stringify([...readLocal(), s].slice(-10)))
  } catch {
    /* sin almacenamiento disponible */
  }
}

export async function topScores(limit = 10): Promise<Score[]> {
  return [...SAMPLE, ...readLocal()].sort((a, b) => b.p - a.p).slice(0, limit)
}
