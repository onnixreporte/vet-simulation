import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { isMuted, setMuted } from '../game/audio'
import {
  BichosEngine, BOTTLE_ICON, BUG_ICON, CLASES, HEART_ICON, HEART_OFF_ICON, TIME_LIMIT, type BUi, type ClaseId, type Modo,
} from '../game/bichos'
import { ICONS, VET, toUrl } from '../game/sprites'
import { MODO_NOMBRE, vetName, type Player } from '../lib/types'

interface Props {
  player: Player
  modo: Modo
  onSave: (pts: number, kills: number, wave: number) => Promise<void>
  onExit: () => void
}

/** Reinicia una animación CSS cada vez que cambia `n`. */
function useRetrigger(n: number) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !n) return
    el.classList.remove('bump', 'hit', 'on')
    void el.offsetWidth
    el.classList.add(el.dataset.anim || 'bump')
  }, [n])
  return ref
}

const clock = (s: number) => `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`
const CLASE_IDS = Object.keys(CLASES) as ClaseId[]

/** Elección de especialidad antes de cada partida. */
function ClasePicker({ modo, onPick, onExit }: { modo: Modo; onPick: (c: ClaseId) => void; onExit: () => void }) {
  return (
    <section className="clases">
      <div className="logo">
        <small>{MODO_NOMBRE[modo].toUpperCase()}</small>
        <h1 className="clases-title">ELEGÍ TU ESPECIALIDAD</h1>
      </div>
      {CLASE_IDS.map((id) => {
        const c = CLASES[id]
        return (
          <button key={id} type="button" className="pbox clase-card" onClick={() => onPick(id)}>
            <img className="px" src={toUrl(VET.open)} alt="" />
            <span>
              <b>{c.name}</b>
              <small>{c.stats}</small>
              <em>
                <i>{c.skill}:</i> {c.desc}
              </em>
            </span>
          </button>
        )
      })}
      <button className="linkish" onClick={onExit}>Volver al modo secreto</button>
    </section>
  )
}

export function Bichos({ player, modo, onSave, onExit }: Props) {
  const [clase, setClase] = useState<ClaseId | null>(null)
  if (!clase) return <ClasePicker modo={modo} onPick={setClase} onExit={onExit} />
  return <Partida key={clase} player={player} modo={modo} clase={clase} onSave={onSave} onExit={onExit} onChange={() => setClase(null)} />
}

function Partida({ player, modo, clase, onSave, onExit, onChange }: Props & { clase: ClaseId; onChange: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const engine = useRef<BichosEngine | null>(null)
  const [ui, setUi] = useState<BUi | null>(null)
  const [saving, setSaving] = useState(false)
  const [mute, setMute] = useState(isMuted)

  const toggleMute = () => {
    setMuted(!mute)
    setMute(!mute)
  }

  const save = async () => {
    if (saving || !ui) return
    setSaving(true)
    try {
      await onSave(ui.pts, ui.kills, ui.wave)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const e = new BichosEngine(canvas.current!, overlay.current!, modo, setUi)
    engine.current = e
    e.start(clase)
    return () => e.destroy()
  }, [modo, clase])

  const ptsRef = useRetrigger(ui?.ptsBump ?? 0)
  const killRef = useRetrigger(ui?.killBump ?? 0)
  const flashRef = useRetrigger(ui?.hit ?? 0)
  const heartsRef = useRetrigger(ui?.hit ?? 0)

  // el botón de disparo se mantiene apretado; con varios dedos cada uno va por su lado
  const fire = (on: boolean) => (ev: PointerEvent<HTMLButtonElement>) => {
    ev.preventDefault()
    if (on) ev.currentTarget.setPointerCapture(ev.pointerId)
    engine.current?.setFiring(on)
  }

  const timed = modo === 'tiempo'
  const time = ui?.time ?? (timed ? TIME_LIMIT : 0)
  const secs = timed ? Math.ceil(time) : Math.floor(time)
  const charge = ui?.charge ?? 0
  const c = CLASES[clase]

  return (
    <section className="game bichos">
      <div className="hud">
        <div className="vetname">
          <b>{c.name.toUpperCase()} · NV {ui?.level ?? 1}</b>
          <span className="hud-right">
            OLEADA {ui?.wave ?? 1}
            <button type="button" className="mute" onClick={toggleMute} aria-label={mute ? 'Activar sonido' : 'Silenciar'} aria-pressed={mute}>
              <img className="px" src={mute ? ICONS.mute : ICONS.sound} alt="" />
            </button>
          </span>
        </div>
        <div ref={heartsRef} data-anim="hit" className="hearts" aria-label={`Vida: ${ui?.hp ?? 0} de ${ui?.maxHp ?? 0}`}>
          {Array.from({ length: ui?.maxHp ?? c.hp }, (_, i) => (
            <img key={i} className="px" src={i < (ui?.hp ?? c.hp) ? HEART_ICON : HEART_OFF_ICON} alt="" />
          ))}
        </div>
        <div className={'stat clock' + (timed && time < 15 ? ' low' : '')} title={timed ? 'Tiempo restante' : 'Tiempo aguantado'}>
          <img className="px" src={ICONS.clock} alt="Tiempo" />
          <span>{clock(secs)}</span>
        </div>
        <div className="bars">
          <div className="bar energy" title="Energía">
            <i style={{ width: ((ui?.energy ?? 100) / (ui?.maxEnergy ?? 100)) * 100 + '%' }} />
            <span>⚡ {ui?.energy ?? 100}</span>
          </div>
          <div className="bar xp" title="Experiencia">
            <i style={{ width: (ui?.xp ?? 0) * 100 + '%' }} />
            <span>XP</span>
          </div>
        </div>
        <div className="hud-row">
          <div ref={killRef} className="stat count" title="Bichos eliminados">
            <img className="px" src={BUG_ICON} alt="Bichos" />
            <span>{ui?.kills ?? 0}</span>
          </div>
          <div className="stat count" title="Animales en la manada">
            <img className="px" src={ICONS.paw} alt="Manada" />
            <span>{ui?.pack ?? 0}</span>
          </div>
          <span className="weapon-name">{ui?.weapon}</span>
          <div ref={ptsRef} className="stat" title="Puntos">
            <img className="px" src={ICONS.coin} alt="Puntos" />
            <span>{ui?.pts ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="stage-wrap">
        <canvas ref={canvas} id="stage" className="px" width={192} height={256} />
        <div className="overlay-layer" ref={overlay}>
          <div className="rlabel" style={{ left: '50%', top: '1.5%', transform: 'translateX(-50%)' }}>RECEPCIÓN</div>
        </div>
        <div className="flash" ref={flashRef} data-anim="on" />
      </div>

      <div className="pad">
        <button
          type="button"
          className="pad-btn nade"
          disabled={!ui || ui.nades < 1}
          onPointerDown={(ev) => {
            ev.preventDefault()
            engine.current?.grenade()
          }}
          onContextMenu={(ev) => ev.preventDefault()}
        >
          <img className="px" src={BOTTLE_ICON} alt="" />
          <span>GRANADA</span>
          <b>{ui?.nades ?? 0}</b>
          <i style={{ height: (ui?.nadeLoad ?? 0) * 100 + '%' }} />
        </button>
        <button
          type="button"
          className="pad-btn fire"
          onPointerDown={fire(true)}
          onPointerUp={fire(false)}
          onPointerCancel={fire(false)}
          onLostPointerCapture={() => engine.current?.setFiring(false)}
          onContextMenu={(ev) => ev.preventDefault()}
        >
          DISPARAR
        </button>
        <button
          type="button"
          className={'pad-btn skill' + (charge >= 1 ? ' ready' : '')}
          disabled={charge < 1}
          onPointerDown={(ev) => {
            ev.preventDefault()
            engine.current?.skill()
          }}
          onContextMenu={(ev) => ev.preventDefault()}
        >
          <i style={{ height: charge * 100 + '%' }} />
          <span>{c.skill.toUpperCase()}</span>
        </button>
      </div>
      <div className="hint">
        <img className="px" src={ICONS.arrow} alt="" />
        <span>
          Arrastrá el dedo en la recepción para moverte. <b>Mantené DISPARAR</b>: apunta solo al bicho más cercano.
        </span>
      </div>

      {ui?.perks && (
        <div className="over">
          <div className="pbox over-card">
            <h2>¡Subiste a nivel {ui.level}!</h2>
            <p className="lead">Elegí una mejora</p>
            <div className="perks">
              {ui.perks.map((k, i) => (
                <button key={ui.level + ':' + i} type="button" className="perk" onClick={() => engine.current?.choosePerk(i)}>
                  <b>{k.label}</b>
                  <span>{k.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {ui?.phase === 'over' && (
        <div className="over">
          <div className="pbox over-card">
            <h2>{ui.end === 'time' ? '¡Se terminó el tiempo!' : '¡Te ganaron los bichos!'}</h2>
            <div className="big-score">{ui.pts}</div>
            <p className="lead">
              {ui.kills} bicho{ui.kills === 1 ? '' : 's'} eliminado{ui.kills === 1 ? '' : 's'} · oleada {ui.wave} · nivel {ui.level}
              {timed ? '' : ` · aguantaste ${clock(secs)}`} en {vetName(player)}.
            </p>
            <button className="btn" disabled={saving} onClick={save}>
              {saving ? 'GUARDANDO…' : 'GUARDAR EN RANKING'}
            </button>
            <button className="btn light" onClick={() => engine.current?.start()}>JUGAR DE NUEVO</button>
            <button className="linkish" onClick={onChange}>Cambiar especialidad</button>
            <button className="linkish" onClick={onExit}>Salir del modo secreto</button>
          </div>
        </div>
      )}
    </section>
  )
}
