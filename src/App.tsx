import { useEffect, useState } from 'react'
import { Bichos } from './components/Bichos'
import { Game } from './components/Game'
import { Intro } from './components/Intro'
import { Menu } from './components/Menu'
import { Ranking } from './components/Ranking'
import { Register } from './components/Register'
import { Secreto } from './components/Secreto'
import { unlockAudio } from './game/audio'
import { loadCases } from './lib/content'
import { saveScore, type SaveResult } from './lib/scores'
import { playerName, SECRET, vetName, type Modo, type Player, type Screen } from './lib/types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [modo, setModo] = useState<Modo>('turno')
  const [player, setPlayer] = useState<Player>({ nombre: '', ig: '', vet: '' })
  const [mine, setMine] = useState<(SaveResult & { pts: number }) | null>(null)

  useEffect(() => {
    loadCases()
    // el navegador habilita el audio recién después de una interacción
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  const go = (s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0 })
  }

  // Escribir el código secreto fuera de un campo de texto abre el modo bichos.
  // En el celular se escribe en cualquier campo del registro (ver Register).
  useEffect(() => {
    if (screen === 'game' || screen === 'bichos') return
    let typed = ''
    const onKey = (ev: KeyboardEvent) => {
      if ((ev.target as HTMLElement | null)?.tagName === 'INPUT' || ev.key.length !== 1) return
      typed = (typed + ev.key.toLowerCase()).slice(-SECRET.length)
      if (typed === SECRET) go('secreto')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen])

  const save = async (pts: number, patients: number, wave?: number) => {
    const r = await saveScore({ n: playerName(player), ig: player.ig, v: vetName(player), p: pts, c: patients, w: wave, o: 2, pet: 'perroMarron' }, modo)
    setMine({ ...r, pts })
    go('ranking')
  }

  /** Cambia de modo; el resultado guardado de otro modo no se marca en este ranking. */
  const pick = (m: Modo, s: Screen) => {
    if (m !== modo) setMine(null)
    setModo(m)
    go(s)
  }

  return (
    <div className="app">
      {screen === 'menu' && <Menu go={(s) => pick('turno', s)} />}
      {screen === 'secreto' && <Secreto pick={pick} go={(s) => pick('turno', s)} />}
      {screen === 'form' && (
        <Register
          initial={player}
          modo={modo}
          go={go}
          onSecret={(p) => {
            setPlayer(p)
            go('secreto')
          }}
          onSubmit={(p) => {
            setPlayer(p)
            go(modo === 'turno' ? 'intro' : 'bichos')
          }}
        />
      )}
      {screen === 'intro' && <Intro player={player} onDone={() => go('game')} />}
      {screen === 'game' && <Game player={player} onSave={save} />}
      {screen === 'bichos' && modo !== 'turno' && (
        <Bichos key={modo} player={player} modo={modo} onSave={save} onExit={() => pick('turno', 'menu')} />
      )}
      {screen === 'ranking' && <Ranking go={go} modo={modo} mine={mine} />}
    </div>
  )
}
