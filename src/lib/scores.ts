import type { PetKey } from '../game/sprites'
import type { Modo } from './types'
import { hasSupabase, rpc, SupabaseError } from './supabase'

export interface Score {
  id?: string
  n: string
  ig: string
  v: string
  p: number
  /** pacientes atendidos en el turno, o bichos eliminados en el modo secreto */
  c?: number
  /** oleada a la que se llegó (solo modo bichos) */
  w?: number
  /** índice del dueño y mascota que se muestran en el podio */
  o: number
  pet: PetKey
  me?: boolean
}

export interface SaveResult {
  id?: string
  puesto?: number
  /** se guardó solo en este dispositivo */
  local: boolean
  error?: string
}

export interface Board {
  rows: Score[]
  /** true si viene de Supabase, false si son datos de ejemplo + locales */
  live: boolean
}

// Se muestran cuando no hay Supabase configurado (desarrollo local) o no responde.
const SAMPLE_BICHOS: Score[] = [
  { n: 'Dr. Mata', ig: '@matapulgas', v: 'Vet Antiplagas', p: 6200, o: 1, pet: 'perroNegro' },
  { n: 'Caro', ig: '@caro.vet', v: 'Patitas Felices', p: 3850, o: 5, pet: 'gatoGris' },
  { n: 'Tomi', ig: '@tomivet', v: 'Clínica Norte', p: 2100, o: 3, pet: 'dino' },
]
const SAMPLE: Score[] = [
  { n: 'Dra. Sofía', ig: '@sofi.vet', v: 'Veterinaria Patitas', p: 2450, o: 5, pet: 'gatoCrema' },
  { n: 'Marcos', ig: '@marcos_vet', v: 'Clínica Huellitas', p: 2100, o: 1, pet: 'perroNegro' },
  { n: 'Lucía', ig: '@luvet', v: 'Vet San Roque', p: 1880, o: 0, pet: 'unicornio' },
  { n: 'Diego', ig: '@dieguito.dvm', v: 'Centro Animal', p: 1520, o: 3, pet: 'perroMarron' },
  { n: 'Ana', ig: '@ana.mascotas', v: 'Patas y Colas', p: 1240, o: 4, pet: 'gatoGris' },
  { n: 'Pedro', ig: '@pedrovet', v: 'Vet del Barrio', p: 980, o: 6, pet: 'dino' },
]
const KEY = 'sp-scores'
const keyOf = (m: Modo) => (m === 'turno' ? KEY : `${KEY}-${m}`)

function readLocal(m: Modo): Score[] {
  try {
    return JSON.parse(localStorage.getItem(keyOf(m)) || '[]')
  } catch {
    return []
  }
}

function saveLocal(s: Score, m: Modo) {
  try {
    localStorage.setItem(keyOf(m), JSON.stringify([...readLocal(m), { ...s, me: true }].slice(-10)))
  } catch {
    /* sin almacenamiento disponible */
  }
}

interface RankRow {
  id: string
  player_name: string
  instagram: string | null
  vet_name: string
  points: number
  owner_idx: number
  pet: PetKey
}

export async function saveScore(s: Score, modo: Modo = 'turno'): Promise<SaveResult> {
  if (!hasSupabase) {
    saveLocal(s, modo)
    return { local: true }
  }
  try {
    // el turno normal no manda p_mode, así sigue andando contra la base sin la migración de modos
    const extra = modo === 'turno' ? {} : { p_mode: modo, p_wave: s.w ?? 0 }
    const [r] = await rpc<{ id: string; rank: number }[]>('submit_score', {
      p_player_name: s.n, p_instagram: s.ig, p_vet_name: s.v, p_points: s.p, p_patients: s.c ?? 0,
      p_owner_idx: s.o, p_pet: s.pet, ...extra,
    })
    return { id: r.id, puesto: r.rank, local: false }
  } catch (err) {
    // El mensaje del cooldown viene armado desde la base (P0001); el resto es genérico.
    const msg = err instanceof SupabaseError && err.status === 400 && /^(Esperá|Puntaje)/.test(err.message)
      ? err.message
      : 'No se pudo guardar en el ranking. Revisá tu conexión.'
    return { local: true, error: msg }
  }
}

export async function topScores(limit = 10, modo: Modo = 'turno'): Promise<Board> {
  if (hasSupabase) {
    try {
      const rows = await rpc<RankRow[]>('top_scores', modo === 'turno' ? { lim: limit } : { lim: limit, p_mode: modo })
      return {
        live: true,
        rows: rows.map((r) => ({
          id: r.id, n: r.player_name, ig: r.instagram ?? '', v: r.vet_name, p: r.points, o: r.owner_idx, pet: r.pet,
        })),
      }
    } catch (err) {
      console.warn('No se pudo leer el ranking de Supabase.', err)
    }
  }
  const sample = modo === 'turno' ? SAMPLE : SAMPLE_BICHOS
  return { live: false, rows: [...sample, ...readLocal(modo)].sort((a, b) => b.p - a.p).slice(0, limit) }
}
