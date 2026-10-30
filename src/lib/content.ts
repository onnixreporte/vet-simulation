import { setCases, type Case, type RoomId } from '../game/cases'
import { PETS, type PetKey } from '../game/sprites'
import { hasSupabase, sb } from './supabase'

interface CaseRow {
  name: string
  pet: string
  species: string
  age: string
  breed: string
  color: string
  gender: string
  description: string
  owner_says: string
  diagnoses: string[]
  room: string
  rare: boolean
}

const ROOMS: RoomId[] = ['banos', 'perros', 'quirofano', 'espera']

function toCase(r: CaseRow): Case | null {
  if (!(r.pet in PETS) || !ROOMS.includes(r.room as RoomId)) return null
  if (!Array.isArray(r.diagnoses) || r.diagnoses.length < 2 || r.diagnoses.some((d) => !d)) return null
  return {
    n: r.name, pet: r.pet as PetKey, esp: r.species, edad: r.age, raza: r.breed, color: r.color,
    gen: r.gender, caso: r.description, dice: r.owner_says, dx: r.diagnoses, room: r.room as RoomId, raro: r.rare,
  }
}

/** Trae los casos activos de Supabase. Si algo falla, el juego sigue con los casos que vienen en el código. */
export async function loadCases(): Promise<void> {
  if (!hasSupabase) return
  try {
    const rows = await sb<CaseRow[]>(
      'cases?select=name,pet,species,age,breed,color,gender,description,owner_says,diagnoses,room,rare&active=eq.true&order=created_at',
    )
    const list = rows.map(toCase).filter((c): c is Case => c !== null)
    if (list.some((c) => !c.raro)) setCases(list)
  } catch (err) {
    console.warn('No se pudieron cargar los casos de Supabase; uso los locales.', err)
  }
}
