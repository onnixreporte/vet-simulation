import { useEffect, useState } from 'react'
import { OWNERS, PETS, toUrl } from '../game/sprites'
import { topScores, type Score } from '../lib/scores'
import type { Screen } from '../lib/types'

export function Ranking({ go }: { go: (s: Screen) => void }) {
  const [rows, setRows] = useState<Score[]>([])

  useEffect(() => {
    topScores(10).then(setRows)
  }, [])

  return (
    <section>
      <div className="logo" style={{ paddingBottom: 10 }}>
        <small>LOS MEJORES TURNOS</small>
      </div>
      <div className="pbox rank-card">
        <h2>Ranking</h2>
        <span className="tag">Datos de ejemplo · luego viene de Supabase</span>
        <div className="podium">
          {[1, 0, 2].map((i) => {
            const r = rows[i]
            if (!r) return <div key={i} />
            const o = OWNERS[r.o] ?? OWNERS[2]
            const p = PETS[r.pet] ?? PETS.perroMarron
            return (
              <div key={i} className={`pod p${i + 1}`}>
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
          {rows.slice(3).map((r, i) => (
            <li key={i} className={r.me ? 'me' : ''}>
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
        <button className="btn" onClick={() => go('form')}>▶ JUGAR</button>
        <button className="linkish" onClick={() => go('menu')}>Volver al menú</button>
      </div>
    </section>
  )
}
