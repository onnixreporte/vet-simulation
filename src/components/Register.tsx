import { useState, type FormEvent } from 'react'
import { MODO_NOMBRE, SECRET, type Modo, type Player, type Screen } from '../lib/types'
import { FacadeScene } from './FacadeScene'

interface Props {
  initial: Player
  modo: Modo
  onSubmit: (p: Player) => void
  /** se escribió el código secreto en algún campo */
  onSecret: (p: Player) => void
  go: (s: Screen) => void
}

export function Register({ initial, modo, onSubmit, onSecret, go }: Props) {
  const [nombre, setNombre] = useState(initial.nombre)
  const [ig, setIg] = useState(initial.ig.replace(/^@/, ''))
  const [vet, setVet] = useState(initial.vet)

  const clean = (n = nombre, i = ig, v = vet): Player => {
    const handle = i.trim().replace(/^@+/, '')
    return { nombre: n.trim(), ig: handle ? '@' + handle : '', vet: v.trim() }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(clean())
  }

  /** Si el campo trae el código secreto, lo saca y abre el modo bichos. */
  const typed = (value: string, set: (v: string) => void, field: 'nombre' | 'ig' | 'vet') => {
    const i = value.toLowerCase().indexOf(SECRET)
    if (i < 0) return set(value)
    const rest = value.slice(0, i) + value.slice(i + SECRET.length)
    set(rest)
    onSecret(clean(field === 'nombre' ? rest : nombre, field === 'ig' ? rest : ig, field === 'vet' ? rest : vet))
  }

  return (
    <section>
      <FacadeScene sign={vet.trim() || 'Tu veterinaria'} cropped />
      <form className="pbox form-card" onSubmit={submit} noValidate>
        <div className="tab">{modo === 'turno' ? 'ALTA DE PERSONAL' : 'MODO SECRETO · ' + MODO_NOMBRE[modo].toUpperCase()}</div>
        <h2>¿Quién atiende hoy?</h2>
        <p className="lead">Tus datos aparecen en el ranking.</p>
        <div className="field">
          <label htmlFor="f-nombre">TU NOMBRE</label>
          <div className="inp">
            <input id="f-nombre" autoComplete="given-name" placeholder="Dra. Sofía" maxLength={24} value={nombre} onChange={(e) => typed(e.target.value, setNombre, 'nombre')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-ig">INSTAGRAM</label>
          <div className="inp">
            <span>@</span>
            <input id="f-ig" placeholder="sofi.vet" maxLength={30} autoCapitalize="none" autoComplete="off" value={ig} onChange={(e) => typed(e.target.value, setIg, 'ig')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-vet">NOMBRE DE TU VETERINARIA</label>
          <div className="inp">
            <input id="f-vet" placeholder="Veterinaria Patitas" maxLength={30} value={vet} onChange={(e) => typed(e.target.value, setVet, 'vet')} />
          </div>
          <small>Va en el cartel de la entrada.</small>
        </div>
        <div className="form-foot">
          <button type="submit" className="btn">{modo === 'turno' ? 'ABRIR LA VETE ▶' : '¡A LOS BICHOS! ▶'}</button>
          <button type="button" className="linkish" onClick={() => go(modo === 'turno' ? 'menu' : 'secreto')}>Volver</button>
        </div>
      </form>
    </section>
  )
}
