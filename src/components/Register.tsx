import { useState, type FormEvent } from 'react'
import { OWNERS, PETS, PET_NAMES, toUrl, type PetKey } from '../game/sprites'
import { MODO_NOMBRE, SECRET, type Modo, type Player } from '../lib/types'
import { Avatar } from './Avatar'
import { FacadeScene } from './FacadeScene'

interface Props {
  initial: Player
  /** 'alta': primera vez, sigue a jugar. 'perfil': edición, vuelve al menú. */
  mode: 'alta' | 'perfil'
  /** qué se va a jugar después del alta: el turno o un modo de bichos */
  modo: Modo
  onSubmit: (p: Player) => void
  /** se escribió el código secreto en algún campo */
  onSecret: (p: Player) => void
  onBack: () => void
}

const PET_KEYS = Object.keys(PETS) as PetKey[]

export function Register({ initial, mode, modo, onSubmit, onSecret, onBack }: Props) {
  const [nombre, setNombre] = useState(initial.nombre)
  const [ig, setIg] = useState(initial.ig.replace(/^@/, ''))
  const [vet, setVet] = useState(initial.vet)
  const [o, setO] = useState(initial.o)
  const [pet, setPet] = useState(initial.pet)

  const clean = (n = nombre, i = ig, v = vet): Player => {
    const handle = i.trim().replace(/^@+/, '')
    return { nombre: n.trim(), ig: handle ? '@' + handle : '', vet: v.trim(), o, pet }
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

  const tab = mode === 'perfil' ? 'PERFIL' : modo === 'turno' ? 'ALTA DE PERSONAL' : 'MODO SECRETO · ' + MODO_NOMBRE[modo].toUpperCase()
  const cta = mode === 'perfil' ? 'GUARDAR' : modo === 'turno' ? 'ABRIR LA VETE ▶' : '¡A LOS BICHOS! ▶'

  return (
    <section>
      <FacadeScene sign={vet.trim() || 'Tu veterinaria'} cropped />
      <form className="pbox form-card" onSubmit={submit} noValidate>
        <div className="tab">{tab}</div>
        <h2>{mode === 'alta' ? '¿Quién atiende hoy?' : 'Tu perfil'}</h2>
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

        <div className="look-preview" aria-hidden="true">
          <figure>
            <Avatar o={o} coat scale={4} />
            <figcaption>EN LA CLÍNICA</figcaption>
          </figure>
          <figure>
            <Avatar o={o} pet={pet} scale={4} />
            <figcaption>EN EL RANKING</figcaption>
          </figure>
        </div>

        <div className="field">
          <span className="label" id="l-look">TU PERSONAJE</span>
          <div className="pick" role="radiogroup" aria-labelledby="l-look">
            {OWNERS.map((who, i) => (
              <button key={i} type="button" role="radio" aria-checked={o === i} aria-label={`Personaje ${i + 1}`} onClick={() => setO(i)}>
                <img className="px" src={toUrl(who.open)} style={{ width: who.open.width * 3 }} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span className="label" id="l-pet">TU MASCOTA</span>
          <div className="pick" role="radiogroup" aria-labelledby="l-pet">
            {PET_KEYS.map((k) => (
              <button key={k} type="button" role="radio" aria-checked={pet === k} aria-label={PET_NAMES[k]} title={PET_NAMES[k]} onClick={() => setPet(k)}>
                <img className="px" src={toUrl(PETS[k].c)} style={{ width: PETS[k].c.width * 3 }} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="form-foot">
          <button type="submit" className="btn">{cta}</button>
          <button type="button" className="linkish" onClick={onBack}>Volver</button>
        </div>
      </form>
    </section>
  )
}
