import { OWNERS, PETS, type PetKey } from '../game/sprites'
import type { Player } from './types'

// El perfil vive sólo en este navegador: no hay cuentas. Si se borran los datos, se carga de nuevo.
const KEY = 'sp-perfil'

export const NEW_PLAYER: Player = { nombre: '', ig: '', vet: '', o: 2, pet: 'perroMarron' }

export function loadProfile(): Player | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (!raw || typeof raw !== 'object') return null
    const text = (v: unknown) => (typeof v === 'string' ? v : '')
    const o = Number.isInteger(raw.o) && raw.o >= 0 && raw.o < OWNERS.length ? raw.o : NEW_PLAYER.o
    const pet = typeof raw.pet === 'string' && raw.pet in PETS ? (raw.pet as PetKey) : NEW_PLAYER.pet
    return { nombre: text(raw.nombre), ig: text(raw.ig), vet: text(raw.vet), o, pet }
  } catch {
    return null
  }
}

export function saveProfile(p: Player) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* sin almacenamiento: el perfil dura hasta cerrar la pestaña */
  }
}
