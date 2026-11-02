import { useEffect, useRef, useState } from 'react'
import isoSvg from '../assets/onnix-isologo.svg?raw'
import logoSvg from '../assets/onnix-logo.svg?raw'
import juegoUrl from '../assets/logo-juego.webp'
import petsysUrl from '../assets/petsys-logo.svg'
import { bootChime, petsysJingle, stopBootChime, unlockAudio } from '../game/audio'

// Los tres arcos del isologo por separado, para que entren volando y se armen.
const ARCS = (isoSvg.match(/ d="([^"]+)"/)?.[1] ?? '').split(/(?=M)/)
// Logo completo en blanco, para dibujarlo chiquito y agrandarlo pixelado.
const LOGO_URL = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logoSvg.replace('<path ', '<path fill="#fff" '))

type Step = 'press' | 'petsys' | 'white' | 'black' | 'out'

/**
 * Momentos de la intro en ms desde el toque. La parte de ONNIX arranca en `white`
 * y su sonido (bootChime) sigue los tiempos contando desde ahí.
 */
const AT = { white: 2600, black: 2600 + 2900, out: 2600 + 5600, done: 2600 + 6200 }

/**
 * Arranque estilo consola de los 90: logo del juego y "tocá para empezar" (habilita el audio),
 * "un juego de Petsys", y después ONNIX: pantalla blanca con el isologo que se arma
 * y pantalla negra con el logo flotando en baja resolución.
 * Tocar en cualquier momento después del primer toque la saltea.
 */
export function Boot({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<Step>('press')
  const lowres = useRef<HTMLCanvasElement>(null)
  const timers = useRef<number[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      const c = lowres.current
      if (!c) return
      const x = c.getContext('2d')!
      x.clearRect(0, 0, c.width, c.height)
      x.drawImage(img, 0, 0, c.width, c.height)
    }
    img.src = LOGO_URL
  }, [])

  const start = () => {
    unlockAudio()
    petsysJingle()
    setStep('petsys')
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))
    at(AT.white, () => {
      bootChime()
      setStep('white')
    })
    at(AT.black, () => setStep('black'))
    at(AT.out, () => setStep('out'))
    at(AT.done, onDone)
  }

  const tap = () => {
    if (step === 'press') return start()
    stopBootChime()
    onDone()
  }

  return (
    <div
      className="boot"
      data-step={step}
      role="button"
      tabIndex={0}
      aria-label={step === 'press' ? 'Tocá para empezar' : 'Saltear intro'}
      onClick={tap}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          tap()
        }
      }}
    >
      <div className="boot-press">
        <img className="boot-game" src={juegoUrl} alt="¡Siguiente Paciente!" />
        <p>TOCÁ PARA EMPEZAR</p>
      </div>
      <div className="boot-petsys" aria-hidden="true">
        <small>UN JUEGO DE</small>
        <img src={petsysUrl} alt="" />
      </div>
      <div className="boot-white" aria-hidden="true">
        <svg className="boot-iso" viewBox="0 0 107 107">
          {ARCS.map((d, i) => (
            <path key={i} d={d} className={`arc a${i}`} />
          ))}
        </svg>
      </div>
      <div className="boot-black">
        <small>DESARROLLADO POR</small>
        <canvas ref={lowres} className="px boot-logo" width={144} height={36} role="img" aria-label="ONNIX" />
      </div>
    </div>
  )
}
