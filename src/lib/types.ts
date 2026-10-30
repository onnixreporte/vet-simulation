import type { Modo as ModoBichos } from '../game/bichos'

export interface Player {
  nombre: string
  ig: string
  vet: string
}

export type Screen = 'menu' | 'form' | 'intro' | 'game' | 'ranking' | 'secreto' | 'bichos'

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
