import type { Modo as ModoBichos } from '../game/bichos'
import type { PetKey } from '../game/sprites'

export interface Player {
  nombre: string
  ig: string
  vet: string
  /** índice del personaje en OWNERS / VETS */
  o: number
  pet: PetKey
}

export type Screen = 'menu' | 'form' | 'perfil' | 'intro' | 'game' | 'ranking' | 'secreto' | 'bichos'

/** turno = juego normal; infinito y tiempo = modo secreto de bichos. Cada uno tiene su ranking. */
export type Modo = 'turno' | ModoBichos

export const MODO_NOMBRE: Record<Modo, string> = {
  turno: 'Turno de guardia',
  infinito: 'Plaga infinita',
  tiempo: 'Plaga contrarreloj',
}

/** Código secreto que abre el modo bichos. */
export const SECRET = 'vetvetvet'

export const vetName = (p: Player) => p.vet || 'Veterinaria Patitas'
export const playerName = (p: Player) => p.nombre || 'Doc'
