import { useEffect, useRef } from 'react'
import { drawFacade, setCtx } from '../game/draw'

interface Props {
  sign: string
  /** Muestra solo la parte de arriba (para el registro). */
  cropped?: boolean
}

export function FacadeScene({ sign, cropped }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ctx = ref.current!.getContext('2d')!
    let raf = 0
    const loop = (now: number) => {
      setCtx(ctx)
      drawFacade(now / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const text = sign.toUpperCase()
  const fontSize = Math.min(2.6, 30 / Math.max(text.length, 1)) + 'cqw'

  return (
    <div className="scene">
      <canvas
        ref={ref}
        className="px"
        width={192}
        height={200}
        style={cropped ? { aspectRatio: '192/120', objectFit: 'cover', objectPosition: 'top' } : undefined}
      />
      <div className="sign-text" style={{ fontSize, ...(cropped ? { top: '56%', height: '12%' } : {}) }}>
        {text}
      </div>
    </div>
  )
}
