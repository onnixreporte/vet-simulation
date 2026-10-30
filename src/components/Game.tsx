import { Fragment, useEffect, useRef, useState } from 'react'
import { isMuted, setMuted } from '../game/audio'
import { GameEngine, TOTAL_TIME, type Ui } from '../game/engine'
import { ICONS, PETS, VETS, toUrl } from '../game/sprites'
import { vetName, type Player } from '../lib/types'

interface Props {
  player: Player
  onSave: (pts: number, patients: number) => Promise<void>
}

/** Rinde "*texto*" como negrita. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('*').map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>))}
    </>
  )
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

export function Game({ player, onSave }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const engine = useRef<GameEngine | null>(null)
  const [ui, setUi] = useState<Ui | null>(null)
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
      await onSave(ui.pts, ui.count)
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const e = new GameEngine(canvas.current!, overlay.current!, setUi, VETS[player.o] ?? VETS[2])
    engine.current = e
    e.start()
    return () => e.destroy()
  }, [player.o])

  const ptsRef = useRetrigger(ui?.ptsBump ?? 0)
  const countRef = useRetrigger(ui?.countBump ?? 0)
  const timeRef = useRetrigger(ui?.hit ?? 0)
  const flashRef = useRetrigger(ui?.hit ?? 0)

  const time = ui?.time ?? TOTAL_TIME
  const secs = Math.ceil(time)
  const f = ui?.ficha
  const pet = f ? PETS[f.c.pet].c : null

  return (
    <section className="game">
      <div className="hud">
        <div className="vetname">
          <b>{vetName(player)}</b>
          <span className="hud-right">
            DÍA 1
            <button type="button" className="mute" onClick={toggleMute} aria-label={mute ? 'Activar sonido' : 'Silenciar'} aria-pressed={mute}>
              <img className="px" src={mute ? ICONS.mute : ICONS.sound} alt="" />
            </button>
          </span>
        </div>
        <div className="timer">
          <img className="px" src={ICONS.clock} alt="" />
          <div ref={timeRef} data-anim="hit" className={'timebar' + (time < 20 ? ' low' : '')}>
            <i style={{ width: (time / TOTAL_TIME) * 100 + '%' }} />
            <span>
              {(secs / 60) | 0}:{String(secs % 60).padStart(2, '0')}
            </span>
          </div>
        </div>
        <div ref={countRef} className="stat count" title="Atendidos">
          <img className="px" src={ICONS.paw} alt="Atendidos" />
          <span>{ui?.count ?? 0}</span>
        </div>
        <div ref={ptsRef} className="stat" title="Puntos">
          <img className="px" src={ICONS.coin} alt="Puntos" />
          <span>{ui?.pts ?? 0}</span>
        </div>
      </div>

      <div className="stage-wrap">
        <canvas ref={canvas} id="stage" className="px" width={192} height={256} />
        <div className="overlay-layer" ref={overlay}>
          <div className="rlabel" style={{ left: '4%', top: '7%' }}>BAÑOS</div>
          <div className="rlabel" style={{ right: '4%', top: '7%' }}>SALA DE MASCOTAS</div>
          <div className="rlabel" style={{ left: '4%', top: '71.5%' }}>QUIRÓFANO</div>
          <div className="rlabel" style={{ right: '4%', top: '71.5%' }}>SALA DE ESPERA</div>
        </div>
        <div className="flash" ref={flashRef} data-anim="on" />
      </div>
      <div className="hint">
        <img className="px" src={ICONS.arrow} alt="" />
        <span>
          <Rich text={ui?.hint ?? ''} />
        </span>
      </div>

      <div className="sheet" data-state={ui?.sheet ?? 'closed'} data-phase={ui?.phase}>
        <div className="pbox ficha">
          <div className="mini-bar">
            <span>Mandá a {f?.c.n} a su sala</span>
            <button onClick={() => engine.current?.toggleSheet()}>{ui?.sheet === 'open' ? 'OCULTAR' : 'VER FICHA'}</button>
          </div>
          <div className="fhead">
            <span>FICHA CLÍNICA</span>
            <b>Nº {String(ui?.num ?? 0).padStart(4, '0')}</b>
          </div>
          {f && pet && (
            <>
              <div className="ftop">
                <div className="polaroid">
                  <div className="ph">
                    <img className="px" src={toUrl(pet)} style={{ width: pet.width * 5 }} alt="" />
                  </div>
                  <div className="nm">{f.c.n}</div>
                </div>
                <dl className="chips">
                  <div className="chip wide"><dt>ESPECIE · RAZA</dt><dd>{f.c.esp} · {f.c.raza}</dd></div>
                  <div className="chip"><dt>EDAD</dt><dd>{f.c.edad}</dd></div>
                  <div className="chip"><dt>GÉNERO</dt><dd>{f.c.gen}</dd></div>
                  <div className="chip wide"><dt>COLOR</dt><dd>{f.c.color}</dd></div>
                </dl>
              </div>
              <div className="quote">
                <img className="px" src={toUrl(f.owner.open)} alt="" />
                <p>“{f.c.dice}”</p>
              </div>
              <div className="motivo">
                <h4>CASO CLÍNICO</h4>
                <p>{f.c.caso}</p>
              </div>
              {f.c.raro && <div className="stamp" key={ui?.num}>¡RARO!</div>}
            </>
          )}
          <div className="q">{ui?.question}</div>
          <div className="opts">
            {ui?.options.map((o, i) => (
              <button
                key={ui.num + ':' + ui.phase + ':' + i}
                className={['opt', o.kind === 'dx' ? '' : o.kind, o.mark || ''].join(' ').trim()}
                disabled={o.disabled}
                onClick={() => engine.current?.choose(i)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ui?.phase === 'over' && (
        <div className="over">
          <div className="pbox over-card">
            <h2>¡Fin del turno!</h2>
            <div className="stars">
              {[0, 1, 2].map((i) => (
                <img key={i} className={'px' + (i < ui.stars ? '' : ' off')} src={ICONS.star} alt="" />
              ))}
            </div>
            <div className="big-score">{ui.pts}</div>
            <p className="lead">
              Atendiste {ui.count} paciente{ui.count === 1 ? '' : 's'} en {vetName(player)}.
            </p>
            <button className="btn" disabled={saving} onClick={save}>
              {saving ? 'GUARDANDO…' : 'GUARDAR EN RANKING'}
            </button>
            <button className="btn light" onClick={() => engine.current?.start()}>JUGAR DE NUEVO</button>
          </div>
        </div>
      )}
    </section>
  )
}
