import { useEffect, useState } from 'react'
import { Game } from './components/Game'
import { Intro } from './components/Intro'
import { Menu } from './components/Menu'
import { Ranking } from './components/Ranking'
import { Register } from './components/Register'
import { unlockAudio } from './game/audio'
import { loadCases } from './lib/content'
import { saveScore, type SaveResult } from './lib/scores'
import { playerName, vetName, type Player, type Screen } from './lib/types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
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

  const save = async (pts: number, patients: number) => {
    const r = await saveScore({ n: playerName(player), ig: player.ig, v: vetName(player), p: pts, c: patients, o: 2, pet: 'perroMarron' })
    setMine({ ...r, pts })
    go('ranking')
  }

  return (
    <div className="app">
      {screen === 'menu' && <Menu go={go} />}
      {screen === 'form' && (
        <Register
          initial={player}
          go={go}
          onSubmit={(p) => {
            setPlayer(p)
            go('intro')
          }}
        />
      )}
      {screen === 'intro' && <Intro player={player} onDone={() => go('game')} />}
      {screen === 'game' && <Game player={player} onSave={save} />}
      {screen === 'ranking' && <Ranking go={go} mine={mine} />}
    </div>
  )
}
