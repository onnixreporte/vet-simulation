import { OWNERS, PETS, VETS, toUrl, type PetKey } from '../game/sprites'

interface Props {
  o: number
  /** sin mascota se muestra sólo el personaje */
  pet?: PetKey
  /** con bata blanca, como atiende en la clínica */
  coat?: boolean
  scale?: number
}

/** Personaje del jugador (y su mascota) en pixel art agrandado. */
export function Avatar({ o, pet, coat = false, scale = 3 }: Props) {
  const who = (coat ? VETS : OWNERS)[o] ?? (coat ? VETS : OWNERS)[2]
  const p = pet ? PETS[pet] : null
  return (
    <div className="avatar">
      <img className="px" src={toUrl(who.open)} style={{ width: who.open.width * scale }} alt="" />
      {p && <img className="px" src={toUrl(p.c)} style={{ width: p.c.width * scale }} alt="" />}
    </div>
  )
}
