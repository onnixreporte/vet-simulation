import { useEffect, useMemo, useRef, useState } from 'react'
import { VETS } from '../game/sprites'
import { playerName, vetName, type Player } from '../lib/types'
import { FacadeScene } from './FacadeScene'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function Intro({ player, onDone }: { player: Player; onDone: () => void }) {
  const lines = useMemo(
    () => [
      `Uff... primer día. Al fin abrimos en ${vetName(player)}. ¿Qué nos depara hoy?`,
      'Cada paciente llega con su dueño. Hay que leer la ficha rápido: especie, edad y el caso clínico.',
      'Elegí qué tiene y arrastralo a su sala: baños, quirófano, sala de mascotas o sala de espera.',
      'Si acertás, sumás puntos. Si te equivocás, perdés tiempo. Si el reloj llega a cero, cerramos por hoy.',
      `Ah... y dicen que a veces aparecen pacientes MUY raros. ¡Suerte, ${playerName(player)}!`,
    ],
    [player],
  )
  const [i, setI] = useState(0)
  const [shown, setShown] = useState(() => (reducedMotion() ? lines[0].length : 0))
  const portrait = useRef<HTMLCanvasElement>(null)
  const full = lines[i]
  const typing = shown < full.length

  useEffect(() => {
    const p = portrait.current!.getContext('2d')!
    p.imageSmoothingEnabled = false
    p.clearRect(0, 0, 16, 16)
    p.drawImage((VETS[player.o] ?? VETS[2]).open, 0, 0, 12, 10, 2, 4, 12, 10)
    p.fillStyle = '#f4f7fb'
    p.fillRect(3, 14, 10, 2)
    p.fillStyle = '#3fb39a'
    p.fillRect(5, 14, 1, 2)
    p.fillRect(10, 14, 1, 2)
  }, [player.o])

  // efecto de máquina de escribir
  useEffect(() => {
    if (!typing) return
    const id = window.setTimeout(() => setShown((k) => k + 1), 22)
    return () => clearTimeout(id)
  }, [typing, shown])

  const advance = () => {
    if (typing) return setShown(full.length)
    if (i >= lines.length - 1) return onDone()
    setI(i + 1)
    setShown(reducedMotion() ? lines[i + 1].length : 0)
  }

  return (
    <section>
      <FacadeScene sign={vetName(player)} />
      <div
        className="dialog"
        role="button"
        tabIndex={0}
        aria-live="polite"
        onClick={advance}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            advance()
          }
        }}
      >
        <div className="dialog-top">
          <div className="portrait">
            <canvas ref={portrait} className="px" width={16} height={16} />
          </div>
          <div className="who">
            {(player.nombre || 'VOS').toUpperCase()}
            <em>07:59 AM · PRIMER DÍA</em>
          </div>
        </div>
        <p>{full.slice(0, shown)}</p>
        <span className="more">▼</span>
      </div>
      <div className="dots">
        {lines.map((_, k) => (
          <i key={k} className={k <= i ? 'on' : ''} />
        ))}
      </div>
      <div className="intro-actions">
        <button className="linkish" onClick={onDone}>Saltar</button>
        <button className="btn" onClick={advance}>{i === lines.length - 1 ? '¡ABRIR LA PUERTA!' : 'SIGUIENTE'}</button>
      </div>
    </section>
  )
}
