import type { Screen } from '../lib/types'
import { FacadeScene } from './FacadeScene'

export function Menu({ go }: { go: (s: Screen) => void }) {
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
      <div className="menu-actions">
        <button className="btn" onClick={() => go('form')}>▶ JUGAR</button>
        <button className="btn blue" onClick={() => go('ranking')}>VER RANKING</button>
      </div>
      <div className="brand">
        un juego de <b>Petsys</b>
      </div>
    </section>
  )
}
