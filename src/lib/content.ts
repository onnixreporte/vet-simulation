import { setCases, type Case, type RoomId } from '../game/cases'
import { PETS, type PetKey } from '../game/sprites'
import { hasSupabase, sb } from './supabase'

interface CaseRow {
  nombre: string
  pet: string
  especie: string
  edad: string
  raza: string
  color: string
  genero: string
  caso: string
  dice: string
  dx: string[]
  room: string
  raro: boolean
}

const ROOMS: RoomId[] = ['banos', 'perros', 'quirofano', 'espera']

function toCase(r: CaseRow): Case | null {
  if (!(r.pet in PETS) || !ROOMS.includes(r.room as RoomId)) return null
  if (!Array.isArray(r.dx) || r.dx.length < 2 || r.dx.some((d) => !d)) return null
  return {
    n: r.nombre, pet: r.pet as PetKey, esp: r.especie, edad: r.edad, raza: r.raza, color: r.color,
    gen: r.genero, caso: r.caso, dice: r.dice, dx: r.dx, room: r.room as RoomId, raro: r.raro,
  }
}

/** Trae los casos activos de Supabase. Si algo falla, el juego sigue con los casos que vienen en el código. */
export async function loadCases(): Promise<void> {
  if (!hasSupabase) return
  try {
    const rows = await sb<CaseRow[]>(
      'cases?select=nombre,pet,especie,edad,raza,color,genero,caso,dice,dx,room,raro&activo=eq.true&order=id',
    )
    const list = rows.map(toCase).filter((c): c is Case => c !== null)
    if (list.some((c) => !c.raro)) setCases(list)
  } catch (err) {
    console.warn('No se pudieron cargar los casos de Supabase; uso los locales.', err)
  }
}
