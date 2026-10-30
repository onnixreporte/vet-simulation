export interface Player {
  nombre: string
  ig: string
  vet: string
}

export type Screen = 'menu' | 'form' | 'intro' | 'game' | 'ranking'

export const vetName = (p: Player) => p.vet || 'Veterinaria Patitas'
export const playerName = (p: Player) => p.nombre || 'Doc'
