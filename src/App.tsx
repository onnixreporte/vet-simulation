import { useEffect, useState } from 'react'
import { Boot } from './components/Boot'
import { Game } from './components/Game'
import { Intro } from './components/Intro'
import { Menu } from './components/Menu'
import { Ranking } from './components/Ranking'
import { Register } from './components/Register'
import { unlockAudio } from './game/audio'
import { loadCases } from './lib/content'
import { loadProfile, NEW_PLAYER, saveProfile } from './lib/profile'
import { saveScore, type SaveResult } from './lib/scores'
import { playerName, vetName, type Player, type Screen } from './lib/types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  // intro "desarrollado por ONNIX": tapa el menú cada vez que se abre el juego
  const [booting, setBooting] = useState(true)
  // perfil guardado en el navegador: si existe, JUGAR va directo al turno
  const [profile, setProfile] = useState<Player | null>(loadProfile)
  const [mine, setMine] = useState<(SaveResult & { pts: number }) | null>(null)
  const player = profile ?? NEW_PLAYER

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
  const play = () => go(profile ? 'game' : 'form')

  const submitProfile = (p: Player) => {
    saveProfile(p)
    setProfile(p)
    go(screen === 'form' ? 'intro' : 'menu')
  }

  const save = async (pts: number, patients: number) => {
    const r = await saveScore({ n: playerName(player), ig: player.ig, v: vetName(player), p: pts, c: patients, o: player.o, pet: player.pet })
    setMine({ ...r, pts })
    go('ranking')
  }

  return (
    <div className="app">
      {booting && <Boot onDone={() => setBooting(false)} />}
      {screen === 'menu' && <Menu go={go} play={play} profile={profile} />}
      {(screen === 'form' || screen === 'perfil') && (
        <Register
          key={screen}
          initial={player}
          mode={screen === 'form' ? 'alta' : 'perfil'}
          onSubmit={submitProfile}
          onBack={() => go('menu')}
        />
      )}
      {screen === 'intro' && <Intro player={player} onDone={() => go('game')} />}
      {screen === 'game' && <Game player={player} onSave={save} />}
      {screen === 'ranking' && <Ranking go={go} play={play} mine={mine} />}
    </div>
  )
}
