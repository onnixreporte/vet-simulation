import { useState } from 'react'
import { Game } from './components/Game'
import { Intro } from './components/Intro'
import { Menu } from './components/Menu'
import { Ranking } from './components/Ranking'
import { Register } from './components/Register'
import { saveScore } from './lib/scores'
import { vetName, type Player, type Screen } from './lib/types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [player, setPlayer] = useState<Player>({ nombre: '', ig: '', vet: '' })

  const go = (s: Screen) => {
    setScreen(s)
    window.scrollTo({ top: 0 })
  }

  const save = async (pts: number) => {
    await saveScore({ n: player.nombre || 'Vos', ig: player.ig, v: vetName(player), p: pts, me: true, o: 2, pet: 'perroMarron' })
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
      {screen === 'ranking' && <Ranking go={go} />}
    </div>
  )
}
