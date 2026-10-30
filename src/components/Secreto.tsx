import { BUG_ICON, TIME_LIMIT } from '../game/bichos'
import type { Modo, Screen } from '../lib/types'

interface Props {
  /** elige el modo y sigue a la pantalla indicada */
  pick: (m: Modo, s: Screen) => void
  go: (s: Screen) => void
}

/** Pantalla que aparece al escribir el código secreto. */
export function Secreto({ pick, go }: Props) {
  return (
    <section className="secreto">
      <div className="logo">
        <small>MODO SECRETO DESBLOQUEADO</small>
        <h1>
          ¡PLAGA EN LA
          <br />
          RECEPCIÓN!
        </h1>
        <p>Entraron pulgas, garrapatas y mosquitos. Frenalos a jeringazos antes de que te ganen.</p>
      </div>
      <img className="px secret-bug" src={BUG_ICON} alt="" />
      <div className="pbox mode-card">
        <h2>Infinito</h2>
        <p className="lead">Oleadas sin fin. Dura hasta que te quedes sin corazones.</p>
        <button className="btn" onClick={() => pick('infinito', 'form')}>▶ JUGAR INFINITO</button>
        <button className="linkish" onClick={() => pick('infinito', 'ranking')}>Ver ranking infinito</button>
      </div>
      <div className="pbox mode-card">
        <h2>Contrarreloj</h2>
        <p className="lead">{TIME_LIMIT / 60} minutos para eliminar todos los bichos que puedas.</p>
        <button className="btn blue" onClick={() => pick('tiempo', 'form')}>▶ JUGAR CONTRARRELOJ</button>
        <button className="linkish" onClick={() => pick('tiempo', 'ranking')}>Ver ranking contrarreloj</button>
      </div>
      <button className="linkish" onClick={() => go('menu')}>Volver al menú</button>
    </section>
  )
}
