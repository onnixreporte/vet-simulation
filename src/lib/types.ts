import type { PetKey } from '../game/sprites'

export interface Player {
  nombre: string
  ig: string
  vet: string
  /** índice del personaje en OWNERS / VETS */
  o: number
  pet: PetKey
}

export type Screen = 'menu' | 'form' | 'perfil' | 'intro' | 'game' | 'ranking'

export const vetName = (p: Player) => p.vet || 'Veterinaria Patitas'
export const playerName = (p: Player) => p.nombre || 'Doc'
