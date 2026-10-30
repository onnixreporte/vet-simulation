// Música y efectos chiptune sintetizados con Web Audio: sin archivos, nada que descargar.
// El navegador solo deja sonar audio después de un toque del usuario: unlockAudio() se llama
// en cada pointerdown y el contexto arranca (o se reanuda) la primera vez.

type Wave = OscillatorType

const MUTE_KEY = 'sp-mute'
let ctx: AudioContext | null = null
let master: GainNode
let musicBus: GainNode
let sfxBus: GainNode
let noiseBuf: AudioBuffer
let muted = readMuted()

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

function ensure(): AudioContext | null {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  try {
    ctx = new AC()
  } catch {
    return null
  }
  master = ctx.createGain()
  master.gain.value = muted ? 0 : 0.9
  master.connect(ctx.destination)
  musicBus = ctx.createGain()
  musicBus.gain.value = 0.32
  musicBus.connect(master)
  sfxBus = ctx.createGain()
  sfxBus.gain.value = 0.55
  sfxBus.connect(master)
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate)
  const d = noiseBuf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  // pausa el audio con la pestaña oculta
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return
    if (document.hidden) ctx.suspend().catch(() => {})
    else ctx.resume().catch(() => {})
  })
  return ctx
}

export function unlockAudio() {
  const c = ensure()
  if (c && c.state === 'suspended' && !document.hidden) c.resume().catch(() => {})
}

export const isMuted = () => muted

export function setMuted(m: boolean) {
  muted = m
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  } catch {
    /* sin almacenamiento */
  }
  if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.02)
}

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12)

/** Una nota con envolvente corta. `to` hace un glissando hasta esa frecuencia. */
function tone(dest: AudioNode, f: number, at: number, dur: number, wave: Wave, vol: number, to?: number) {
  const c = ctx!
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = wave
  o.frequency.setValueAtTime(f, at)
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(vol, at + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(dest)
  o.start(at)
  o.stop(at + dur + 0.02)
}

function hiss(dest: AudioNode, at: number, dur: number, vol: number, cutoff = 7000) {
  const c = ctx!
  const s = c.createBufferSource()
  s.buffer = noiseBuf
  const f = c.createBiquadFilter()
  f.type = 'highpass'
  f.frequency.value = cutoff
  const g = c.createGain()
  g.gain.setValueAtTime(vol, at)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  s.connect(f).connect(g).connect(dest)
  s.start(at)
  s.stop(at + dur + 0.02)
}

/** Corre `fn` solo si hay audio disponible y el contexto está andando. */
function play(fn: (t: number) => void) {
  const c = ensure()
  if (!c || c.state !== 'running' || muted) return
  fn(c.currentTime + 0.005)
}

const seq = (notes: number[], step: number, wave: Wave, vol: number, len = step * 1.4) =>
  play((t) => notes.forEach((n, i) => tone(sfxBus, hz(n), t + i * step, len, wave, vol)))

export const sfx = {
  /** timbre de la puerta: llega un paciente */
  ding: () => seq([84, 79], 0.11, 'triangle', 0.35, 0.35),
  /** llega un paciente raro */
  sparkle: () => seq([84, 88, 91, 96, 91, 96], 0.05, 'square', 0.12, 0.12),
  /** botón de la ficha */
  blip: () => seq([79], 0.05, 'square', 0.12, 0.06),
  /** levantar al paciente para arrastrarlo */
  pop: () => play((t) => tone(sfxBus, 420, t, 0.08, 'square', 0.12, 880)),
  /** suma de puntos: más alto cuanto más vale */
  coin: (big: boolean) => seq(big ? [83, 88, 95] : [83, 88], 0.06, 'square', 0.14, 0.12),
  /** error: diagnóstico o sala equivocada */
  bad: () =>
    play((t) => {
      tone(sfxBus, 180, t, 0.22, 'sawtooth', 0.16, 90)
      tone(sfxBus, 186, t, 0.22, 'square', 0.08, 95)
    }),
  /** cuenta regresiva de los últimos segundos */
  tick: (last: boolean) => play((t) => {
    tone(sfxBus, last ? 1320 : 990, t, 0.05, 'square', 0.09)
    hiss(sfxBus, t, 0.03, 0.05)
  }),
  /** fin del turno: más alegre con más estrellas */
  end: (stars: number) =>
    seq(stars >= 2 ? [72, 76, 79, 84, 79, 84, 88] : stars === 1 ? [72, 76, 79, 76, 72] : [72, 70, 67, 64], 0.11, 'square', 0.15, 0.2),
}

/* ---------- música ---------- */

// Loop original de 4 compases (C, G, Am, F), en corcheas. null = silencio.
const LEAD: (number | null)[] = [
  76, null, 79, 76, 72, null, 74, 76,
  74, null, 79, 74, 71, null, 72, 74,
  72, null, 76, 72, 69, null, 71, 72,
  69, 72, 77, 76, 74, 72, 74, null,
  76, 79, 84, 79, 76, null, 79, 81,
  79, null, 74, 79, 83, null, 81, 79,
  76, null, 72, 76, 81, 79, 76, 72,
  77, 76, 74, 72, 74, null, 72, null,
]
const ROOTS = [48, 43, 45, 41]
const BASE_BPM = 128

class Music {
  private timer = 0
  private step = 0
  private next = 0
  private pace = 1

  start() {
    const c = ensure()
    if (!c) return
    this.stop()
    this.step = 0
    this.next = c.currentTime + 0.1
    this.timer = window.setInterval(this.schedule, 25)
  }

  stop() {
    window.clearInterval(this.timer)
    this.timer = 0
  }

  /** 1 = ritmo normal; sube a medida que avanza el turno. */
  setPace(p: number) {
    this.pace = p
  }

  private schedule = () => {
    const c = ctx
    if (!c) return
    // con el contexto pausado no se agenda nada y se vuelve a enganchar al reanudar
    if (c.state !== 'running') {
      this.next = c.currentTime + 0.05
      return
    }
    const stepDur = 60 / (BASE_BPM * this.pace) / 2
    while (this.next < c.currentTime + 0.12) {
      this.note(this.step, this.next, stepDur)
      this.next += stepDur
      this.step = (this.step + 1) % LEAD.length
    }
  }

  private note(i: number, at: number, d: number) {
    const bar = ((i / 8) | 0) % 4, beat = i % 8
    const lead = LEAD[i]
    if (lead != null) tone(musicBus, hz(lead), at, d * 0.9, 'square', 0.11)
    if (beat % 2 === 0) tone(musicBus, hz(ROOTS[bar] + (beat % 4 === 2 ? 12 : 0)), at, d * 1.6, 'triangle', 0.3)
    if (beat === 0 || beat === 4) tone(musicBus, 150, at, 0.12, 'sine', 0.5, 45)
    if (beat % 2 === 1) hiss(musicBus, at, 0.04, 0.12)
  }
}

export const music = new Music()
