import { useEffect, useState } from 'react'
import { Bichos } from './components/Bichos'
import { Boot } from './components/Boot'
import { Game } from './components/Game'
import { Intro } from './components/Intro'
import { Menu } from './components/Menu'
import { Ranking } from './components/Ranking'
import { Register } from './components/Register'
import { Secreto } from './components/Secreto'
import { unlockAudio } from './game/audio'
import { loadCases } from './lib/content'
import { loadProfile, NEW_PLAYER, saveProfile } from './lib/profile'
import { saveScore, type SaveResult } from './lib/scores'
import { playerName, SECRET, vetName, type Modo, type Player, type Screen } from './lib/types'

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  // intro "desarrollado por ONNIX": tapa el menú cada vez que se abre el juego
  const [booting, setBooting] = useState(true)
  // perfil guardado en el navegador: si existe, JUGAR va directo a la partida
  const [profile, setProfile] = useState<Player | null>(loadProfile)
  // lo que se venía escribiendo en el alta cuando apareció el código secreto
  const [draft, setDraft] = useState<Player | null>(null)
  const [modo, setModo] = useState<Modo>('turno')
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

  /** Cambia de modo; el resultado guardado de otro modo no se marca en este ranking. */
  const pick = (m: Modo, s: Screen) => {
    if (m !== modo) setMine(null)
    setModo(m)
    go(s)
  }

  /** Con perfil va directo a la partida; sin perfil, primero el alta. */
  const play = (m: Modo) => pick(m, profile ? (m === 'turno' ? 'game' : 'bichos') : 'form')

  const submitProfile = (p: Player) => {
    saveProfile(p)
    setProfile(p)
    setDraft(null)
    if (screen === 'perfil') go('menu')
    else go(modo === 'turno' ? 'intro' : 'bichos')
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
    const r = await saveScore({ n: playerName(player), ig: player.ig, v: vetName(player), p: pts, c: patients, w: wave, o: player.o, pet: player.pet }, modo)
    setMine({ ...r, pts })
    go('ranking')
  }

  return (
    <div className="app">
      {booting && <Boot onDone={() => setBooting(false)} />}
      {screen === 'menu' && <Menu go={(s) => pick('turno', s)} play={() => play('turno')} profile={profile} />}
      {screen === 'secreto' && <Secreto pick={(m, s) => (s === 'form' ? play(m) : pick(m, s))} go={(s) => pick('turno', s)} />}
      {(screen === 'form' || screen === 'perfil') && (
        <Register
          key={screen}
          initial={(screen === 'form' && draft) || player}
          mode={screen === 'form' ? 'alta' : 'perfil'}
          modo={modo}
          onSubmit={submitProfile}
          onSecret={(p) => {
            // en el alta se guarda lo escrito para no perderlo al volver
            if (screen === 'form') setDraft(p)
            go('secreto')
          }}
          onBack={() => go(screen === 'form' && modo !== 'turno' ? 'secreto' : 'menu')}
        />
      )}
      {screen === 'intro' && <Intro player={player} onDone={() => go('game')} />}
      {screen === 'game' && <Game player={player} onSave={save} />}
      {screen === 'bichos' && modo !== 'turno' && (
        <Bichos key={modo} player={player} modo={modo} onSave={save} onExit={() => pick('turno', 'menu')} />
      )}
      {screen === 'ranking' && <Ranking go={go} play={() => play(modo)} modo={modo} mine={mine} />}
    </div>
  )
}
