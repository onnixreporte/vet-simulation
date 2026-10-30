import { vetName, type Player, type Screen } from '../lib/types'
import { Avatar } from './Avatar'
import { FacadeScene } from './FacadeScene'

interface Props {
  go: (s: Screen) => void
  play: () => void
  /** perfil guardado en este navegador; null si es la primera vez */
  profile: Player | null
}

export function Menu({ go, play, profile }: Props) {
  return (
    <section className="menu">
      <div className="logo">
        <small>GUARDIA VETERINARIA</small>
        <h1>
          ¡SIGUIENTE
          <br />
          PACIENTE!
        </h1>
      </div>
      <FacadeScene sign="Petsys" />
      {profile && (
        <div className="pbox me-card">
          <Avatar o={profile.o} pet={profile.pet} scale={3} />
          <div>
            <b>¡Hola, {profile.nombre || 'Doc'}!</b>
            <span>{vetName(profile)}</span>
          </div>
        </div>
      )}
      <div className="menu-actions">
        <button className="btn" onClick={play}>▶ JUGAR</button>
        {profile && <button className="btn light" onClick={() => go('perfil')}>PERFIL</button>}
        <button className="btn blue" onClick={() => go('ranking')}>VER RANKING</button>
      </div>
      <div className="brand">
        un juego de <b>Petsys</b>
      </div>
    </section>
  )
}
