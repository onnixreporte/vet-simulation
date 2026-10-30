import { useState, type FormEvent } from 'react'
import type { Player, Screen } from '../lib/types'
import { FacadeScene } from './FacadeScene'

interface Props {
  initial: Player
  onSubmit: (p: Player) => void
  go: (s: Screen) => void
}

export function Register({ initial, onSubmit, go }: Props) {
  const [nombre, setNombre] = useState(initial.nombre)
  const [ig, setIg] = useState(initial.ig.replace(/^@/, ''))
  const [vet, setVet] = useState(initial.vet)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const handle = ig.trim().replace(/^@+/, '')
    onSubmit({ nombre: nombre.trim(), ig: handle ? '@' + handle : '', vet: vet.trim() })
  }

  return (
    <section>
      <FacadeScene sign={vet.trim() || 'Tu veterinaria'} cropped />
      <form className="pbox form-card" onSubmit={submit} noValidate>
        <div className="tab">ALTA DE PERSONAL</div>
        <h2>¿Quién atiende hoy?</h2>
        <p className="lead">Tus datos aparecen en el ranking.</p>
        <div className="field">
          <label htmlFor="f-nombre">TU NOMBRE</label>
          <div className="inp">
            <input id="f-nombre" autoComplete="given-name" placeholder="Dra. Sofía" maxLength={24} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-ig">INSTAGRAM</label>
          <div className="inp">
            <span>@</span>
            <input id="f-ig" placeholder="sofi.vet" maxLength={30} autoCapitalize="none" autoComplete="off" value={ig} onChange={(e) => setIg(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-vet">NOMBRE DE TU VETERINARIA</label>
          <div className="inp">
            <input id="f-vet" placeholder="Veterinaria Patitas" maxLength={30} value={vet} onChange={(e) => setVet(e.target.value)} />
          </div>
          <small>Va en el cartel de la entrada.</small>
        </div>
        <div className="form-foot">
          <button type="submit" className="btn">ABRIR LA VETE ▶</button>
          <button type="button" className="linkish" onClick={() => go('menu')}>Volver al menú</button>
        </div>
      </form>
    </section>
  )
}
