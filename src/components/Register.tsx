import { useState, type FormEvent } from 'react'
import { OWNERS, PETS, PET_NAMES, toUrl, type PetKey } from '../game/sprites'
import type { Player } from '../lib/types'
import { Avatar } from './Avatar'
import { FacadeScene } from './FacadeScene'

interface Props {
  initial: Player
  /** 'alta': primera vez, sigue a la intro. 'perfil': edición, vuelve al menú. */
  mode: 'alta' | 'perfil'
  onSubmit: (p: Player) => void
  onBack: () => void
}

const PET_KEYS = Object.keys(PETS) as PetKey[]

export function Register({ initial, mode, onSubmit, onBack }: Props) {
  const [nombre, setNombre] = useState(initial.nombre)
  const [ig, setIg] = useState(initial.ig.replace(/^@/, ''))
  const [vet, setVet] = useState(initial.vet)
  const [o, setO] = useState(initial.o)
  const [pet, setPet] = useState(initial.pet)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const handle = ig.trim().replace(/^@+/, '')
    onSubmit({ nombre: nombre.trim(), ig: handle ? '@' + handle : '', vet: vet.trim(), o, pet })
  }

  return (
    <section>
      <FacadeScene sign={vet.trim() || 'Tu veterinaria'} cropped />
      <form className="pbox form-card" onSubmit={submit} noValidate>
        <div className="tab">{mode === 'alta' ? 'ALTA DE PERSONAL' : 'PERFIL'}</div>
        <h2>{mode === 'alta' ? '¿Quién atiende hoy?' : 'Tu perfil'}</h2>
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
          <button type="submit" className="btn">{mode === 'alta' ? 'ABRIR LA VETE ▶' : 'GUARDAR'}</button>
          <button type="button" className="linkish" onClick={onBack}>Volver al menú</button>
        </div>
      </form>
    </section>
  )
}
