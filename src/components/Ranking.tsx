import { useEffect, useState } from 'react'
import { OWNERS, PETS, toUrl } from '../game/sprites'
import { topScores, type SaveResult, type Score } from '../lib/scores'
import type { Screen } from '../lib/types'

interface Props {
  go: (s: Screen) => void
  play: () => void
  /** resultado del turno recién guardado */
  mine: (SaveResult & { pts: number }) | null
}

export function Ranking({ go, play, mine }: Props) {
  const [rows, setRows] = useState<Score[] | null>(null)
  const [live, setLive] = useState(true)

  useEffect(() => {
    let alive = true
    topScores(10).then((b) => {
      if (!alive) return
      setRows(b.rows.map((r) => ({ ...r, me: r.me || (mine?.id != null && r.id === mine.id) })))
      setLive(b.live)
    })
    return () => {
      alive = false
    }
  }, [mine])

  const list = rows ?? []
  const shown = list.some((r) => r.me && r.id != null)
  const note = mine?.error
    ? mine.error
    : mine?.puesto && !shown
      ? `Tu turno: ${mine.pts} puntos · puesto ${mine.puesto}`
      : null

  return (
    <section>
      <div className="logo" style={{ paddingBottom: 10 }}>
        <small>LOS MEJORES TURNOS</small>
      </div>
      <div className="pbox rank-card">
        <h2>Ranking</h2>
        {!live && <span className="tag">Datos de ejemplo</span>}
        {rows === null && <p className="lead">Cargando…</p>}
        {rows !== null && list.length === 0 && <p className="lead">Todavía nadie guardó un turno. ¡Sé el primero!</p>}
        {note && <p className="lead rank-note">{note}</p>}
        <div className="podium">
          {[1, 0, 2].map((i) => {
            const r = list[i]
            if (!r) return <div key={i} />
            const o = OWNERS[r.o] ?? OWNERS[2]
            const p = PETS[r.pet] ?? PETS.perroMarron
            return (
              <div key={i} className={`pod p${i + 1}${r.me ? ' me' : ''}`}>
                <div className="who-img">
                  <img className="px" src={toUrl(o.open)} style={{ width: o.open.width * 3 }} alt="" />
                  <img className="px" src={toUrl(p.c)} style={{ width: p.c.width * 3 }} alt="" />
                </div>
                <div className="nm">{r.n}</div>
                <div className="pt">{r.p}</div>
                <div className="block">{i + 1}</div>
              </div>
            )
          })}
        </div>
        <ol className="rlist">
          {list.slice(3).map((r, i) => (
            <li key={r.id ?? `l${i}`} className={r.me ? 'me' : ''}>
              <span className="n">{i + 4}</span>
              <span className="w">
                <b>
                  {r.n} <small style={{ fontWeight: 400, color: '#7b6b76' }}>{r.ig}</small>
                </b>
                <span>{r.v}</span>
              </span>
              <span className="p">{r.p}</span>
            </li>
          ))}
        </ol>
      </div>
      <div style={{ display: 'grid', gap: 4, marginTop: 18 }}>
        <button className="btn" onClick={play}>▶ JUGAR</button>
        <button className="linkish" onClick={() => go('menu')}>Volver al menú</button>
      </div>
    </section>
  )
}
