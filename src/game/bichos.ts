// Modo secreto "¡Plaga en la recepción!" (se activa escribiendo vetvetvet).
// Los bichos entran a la recepción y el veterinario los frena con su arma de vacunas y
// granadas de detergente. Se mueve con un joystick táctil (o WASD / flechas), dispara con
// el botón (apunta solo al bicho más cercano) y al subir de nivel elige una mejora.
import { music, sfx } from './audio'
import { R, circle, drawDesk, drawPlant, setCtx, shadow, W, H } from './draw'
import { compile, INK, PETS, type Person, type PetKey } from './sprites'

export type Modo = 'infinito' | 'tiempo'
/** Duración del modo contrarreloj, en segundos. */
export const TIME_LIMIT = 120
const BASE_HP = 6
/** Tope de bichos en pantalla a la vez. */
const MAX_BUGS = 45

type Kind = 'pulga' | 'garrapata' | 'mosquito' | 'reina'

const TICK_ROWS = [
  '...k...k...',
  '....kkk....',
  '...kdddk...',
  '.kkbbbbbkk.',
  'kkbbBbBbbkk',
  '..kbbbbbk..',
  'kkbbBbBbbkk',
  '..kbbbbbk..',
  '.k.kbbbk.k.',
  '....kkk....',
]
const SPR = {
  pulga: compile([
    '..kkk....',
    '.kbbbk...',
    'kbebbbkk.',
    'kbbbbbbBk',
    '.kbbbbBk.',
    'k.kBBBk.k',
    '.k.k.k.k.',
  ], { b: '#b06a3c', B: '#7a4524', e: '#fff5df' }),
  garrapata: compile(TICK_ROWS, { b: '#6b4a7a', B: '#9a74ad', d: '#3a2a44' }),
  mosquito: compile([
    '.ww.....ww.',
    'wwww...wwww',
    '.wwwkkkwww.',
    '...kbbbk...',
    'kkkbebbbkkk',
    '...kbbbk...',
    '..k.kkk.k..',
    '.k.......k.',
  ], { w: '#cfe8ff', b: '#5a6b52', e: '#ff6b6b' }),
  reina: compile(TICK_ROWS, { b: '#a83a5a', B: '#e06a8a', d: '#4a1a2a' }),
}
const BOTTLE = compile(['.kk.', 'kwwk', 'kbbk', 'kbBk', 'kbBk', 'kkkk'], { w: '#fff5df', b: '#4b92c0', B: '#8fd3ff' })

const HEART_ROWS = ['.kk.kk.', 'krrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...']
const HEART = compile(HEART_ROWS, { r: '#ff6b6b' })
export const HEART_ICON = HEART.toDataURL()
export const HEART_OFF_ICON = compile(HEART_ROWS, { r: '#4a3f63' }).toDataURL()
export const BUG_ICON = SPR.pulga.toDataURL()
export const BOTTLE_ICON = BOTTLE.toDataURL()

const KINDS: Record<Kind, { hp: number; speed: number; r: number; pts: number; xp: number; scale: number }> = {
  pulga: { hp: 1, speed: 50, r: 3, pts: 50, xp: 1, scale: 1 },
  garrapata: { hp: 4, speed: 20, r: 5, pts: 100, xp: 2, scale: 1 },
  mosquito: { hp: 2, speed: 34, r: 4, pts: 100, xp: 2, scale: 1 },
  reina: { hp: 40, speed: 13, r: 10, pts: 500, xp: 12, scale: 2 },
}

/* ---------- armas ---------- */
export type WeaponId = 'vacunas' | 'escopeta' | 'rociador' | 'jeringota'
interface Weapon {
  name: string
  /** disparos por segundo */
  rate: number
  dmg: number
  pellets: number
  spread: number
  speed: number
  life: number
  /** energía por disparo; la pistola de vacunas no gasta */
  cost: number
  pierce?: boolean
  color: string
}
export const WEAPONS: Record<WeaponId, Weapon> = {
  vacunas: { name: 'Pistola de vacunas', rate: 4, dmg: 1, pellets: 1, spread: 0.05, speed: 180, life: 0.9, cost: 0, color: '#63dfb0' },
  escopeta: { name: 'Escopeta antipulgas', rate: 1.7, dmg: 1, pellets: 5, spread: 0.55, speed: 165, life: 0.55, cost: 4, color: '#ffc94a' },
  rociador: { name: 'Rociador de vacunas', rate: 11, dmg: 1, pellets: 1, spread: 0.3, speed: 150, life: 0.5, cost: 1, color: '#8fd3ff' },
  jeringota: { name: 'Jeringota perforante', rate: 1.3, dmg: 5, pellets: 1, spread: 0, speed: 230, life: 1.1, cost: 5, pierce: true, color: '#ff9ab0' },
}

/* ---------- especialidades: cada una con su habilidad ---------- */
export type ClaseId = 'clinica' | 'cirujana' | 'peluquero'
export const CLASES: Record<ClaseId, { name: string; skill: string; desc: string; stats: string; hp: number; speed: number; nades: number; dmg: number }> = {
  clinica: {
    name: 'Clínica general', skill: 'Vacunazo', desc: 'Onda de vacunas que daña todo alrededor y borra los disparos enemigos.',
    stats: '6 corazones · velocidad normal', hp: 6, speed: 62, nades: 2, dmg: 0,
  },
  cirujana: {
    name: 'Cirujana', skill: 'Bisturís', desc: 'Cuatro bisturís giran a tu alrededor durante 6 segundos.',
    stats: '5 corazones · rápida · +1 de daño', hp: 5, speed: 68, nades: 2, dmg: 1,
  },
  peluquero: {
    name: 'Peluquero', skill: 'Baño de espuma', desc: 'Llena de espuma todo alrededor y te cura 1 corazón.',
    stats: '7 corazones · lento · 3 granadas', hp: 7, speed: 56, nades: 3, dmg: 0,
  },
}
const BLADES = 6

/* ---------- manada: animales que se suman al pasar cada oleada ---------- */
const MAX_PACK = 8
/** Cada animal pelea a su manera: los perros muerden, los gatos son rápidos, el unicornio dispara brillos. */
const ALLIES: Record<PetKey, { name: string; speed: number; dmg: number; rate: number; ranged?: boolean }> = {
  perroMarron: { name: 'Toby', speed: 70, dmg: 1, rate: 1.6 },
  gatoCrema: { name: 'Michi', speed: 85, dmg: 1, rate: 2.4 },
  perroNegro: { name: 'Rocky', speed: 64, dmg: 2, rate: 1.2 },
  gatoNaranja: { name: 'Garfio', speed: 85, dmg: 1, rate: 2.4 },
  perroBlanco: { name: 'Copito', speed: 70, dmg: 1, rate: 1.8 },
  gatoGris: { name: 'Luna', speed: 88, dmg: 1, rate: 2.6 },
  perroSalchi: { name: 'Coca', speed: 60, dmg: 1, rate: 2 },
  dino: { name: 'Rex Jr.', speed: 55, dmg: 4, rate: 0.8 },
  unicornio: { name: 'Destello', speed: 60, dmg: 1, rate: 1.4, ranged: true },
  elefante: { name: 'Pancho', speed: 45, dmg: 6, rate: 0.5 },
}
const PACK_ORDER: PetKey[] = ['perroMarron', 'gatoCrema', 'perroNegro', 'unicornio', 'gatoNaranja', 'dino', 'perroSalchi', 'gatoGris', 'elefante', 'perroBlanco']
interface Ally { key: PetKey; x: number; y: number; flip: boolean; cd: number; moving: boolean }

/* ---------- mejoras al subir de nivel ---------- */
interface Player {
  x: number; y: number; flip: boolean; ax: number; ay: number
  hp: number; maxHp: number; inv: number; speed: number
  weapon: WeaponId; cd: number; rate: number; dmg: number; extra: number
  energy: number; maxEnergy: number; regen: number
  nades: number; maxNades: number; nadeCd: number
  vacGain: number
  /** animales en la manada */
  pack: number
}
interface Perk { label: string; desc: string; ok: (p: Player) => boolean; apply: (p: Player, adopt: () => void) => void }
const PERKS: Perk[] = [
  { label: 'Jeringa doble', desc: '+1 jeringa por disparo', ok: (p) => p.extra < 3, apply: (p) => { p.extra++ } },
  { label: 'Pulso firme', desc: 'Disparás 20% más rápido', ok: (p) => p.rate < 2.5, apply: (p) => { p.rate *= 1.2 } },
  { label: 'Dosis fuerte', desc: '+1 de daño', ok: (p) => p.dmg < 4, apply: (p) => { p.dmg++ } },
  { label: 'Zapatillas', desc: 'Te movés 12% más rápido', ok: (p) => p.speed < 95, apply: (p) => { p.speed *= 1.12 } },
  { label: 'Corazón extra', desc: '+1 corazón máximo', ok: (p) => p.maxHp < 10, apply: (p) => { p.maxHp++; p.hp++ } },
  { label: 'Curita', desc: 'Recuperás 3 corazones', ok: (p) => p.hp < p.maxHp, apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + 3) } },
  { label: 'Más detergente', desc: '+1 granada', ok: (p) => p.maxNades < 5, apply: (p) => { p.maxNades++; p.nades = p.maxNades } },
  { label: 'Termo de café', desc: '+30 de energía y carga más rápido', ok: (p) => p.maxEnergy < 220, apply: (p) => { p.maxEnergy += 30; p.regen += 3; p.energy = p.maxEnergy } },
  { label: 'Adopción', desc: '+1 animal a la manada', ok: (p) => p.pack < MAX_PACK, apply: (_p, adopt) => adopt() },
  { label: 'Refuerzo', desc: 'La habilidad carga más rápido', ok: (p) => p.vacGain < 0.2, apply: (p) => { p.vacGain *= 1.5 } },
]

/** Escritorio de recepción: los bichos y las jeringas no lo atraviesan. */
const DESK = { x: 66, y: 95, w: 60, h: 21 }
const TOP = 28
const SPAWNS = [[96, 246], [12, 150], [180, 150], [22, 40], [170, 40]]
const NADE_RECHARGE = 6
const BLAST = 26

export interface BUi {
  phase: 'play' | 'over'
  /** contrarreloj: segundos que quedan; infinito: segundos aguantados */
  time: number
  kills: number
  pts: number
  wave: number
  hp: number
  maxHp: number
  energy: number
  maxEnergy: number
  weapon: string
  nades: number
  maxNades: number
  /** recarga de la próxima granada, de 0 a 1 */
  nadeLoad: number
  level: number
  /** experiencia hacia el próximo nivel, de 0 a 1 */
  xp: number
  /** animales en la manada */
  pack: number
  /** mejoras para elegir al subir de nivel; con esto el juego queda en pausa */
  perks: { label: string; desc: string }[] | null
  /** carga de la habilidad, de 0 a 1 */
  charge: number
  /** por qué terminó: lo ganaron los bichos o se acabó el tiempo */
  end: 'dead' | 'time' | null
  ptsBump: number
  killBump: number
  hit: number
}

interface Bug { k: Kind; x: number; y: number; hp: number; maxHp: number; cd: number; flash: number; seed: number }
interface Shot { x: number; y: number; vx: number; vy: number; dmg: number; life: number; foe: boolean; pierce?: Set<Bug>; color?: string }
interface Warn { k: Kind; x: number; y: number; t: number }
interface Drop { kind: 'heart' | 'chest'; x: number; y: number; life: number; weapon?: WeaponId }
interface Nade { x0: number; y0: number; x1: number; y1: number; t: number }
interface Foam { x: number; y: number; life: number; tick: number }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0]
const xpFor = (lvl: number) => 6 + lvl * 5

/** Empuja un círculo fuera del escritorio y lo deja dentro de la recepción. */
function keepIn(o: { x: number; y: number }, r: number) {
  const cx = clamp(o.x, DESK.x, DESK.x + DESK.w), cy = clamp(o.y, DESK.y, DESK.y + DESK.h)
  const dx = o.x - cx, dy = o.y - cy, d = Math.hypot(dx, dy)
  if (d < r) {
    if (d === 0) o.y = DESK.y + DESK.h + r
    else {
      o.x += (dx / d) * (r - d)
      o.y += (dy / d) * (r - d)
    }
  }
  o.x = clamp(o.x, 8 + r, W - 8 - r)
  o.y = clamp(o.y, TOP + r, H - 6 - r)
}
const inDesk = (x: number, y: number) => x > DESK.x && x < DESK.x + DESK.w && y > DESK.y && y < DESK.y + DESK.h

export class BichosEngine {
  private ctx: CanvasRenderingContext2D
  private p!: Player
  private bugs: Bug[] = []
  private shots: Shot[] = []
  private warns: Warn[] = []
  private drops: Drop[] = []
  private nades: Nade[] = []
  private foams: Foam[] = []
  private allies: Ally[] = []
  private queue: Kind[] = []
  private perkOpts: Perk[] = []
  private xp = 0
  private spawnCd = 0
  private rest = 0
  private ring = 0
  /** segundos que les quedan a los bisturís girando */
  private blades = 0
  private bladeHit = new Map<Bug, number>()
  private clase: ClaseId = 'clinica'
  private firing = false
  private keys = new Set<string>()
  private joy: { id: number; ox: number; oy: number; x: number; y: number } | null = null
  private raf = 0
  private last = 0
  private lastEmit = 0
  private lastTick = 0
  ui: BUi

  private canvas: HTMLCanvasElement
  private overlay: HTMLElement
  private modo: Modo
  private onUi: (ui: BUi) => void
  /** personaje del jugador, con bata */
  private vet: Person

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement, modo: Modo, onUi: (ui: BUi) => void, vet: Person) {
    this.canvas = canvas
    this.vet = vet
    this.overlay = overlay
    this.modo = modo
    this.onUi = onUi
    this.ctx = canvas.getContext('2d')!
    this.ctx.imageSmoothingEnabled = false
    this.ui = this.freshUi()
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onUp)
    window.addEventListener('keydown', this.onKey)
    window.addEventListener('keyup', this.onKey)
  }

  private freshUi(): BUi {
    return {
      phase: 'play', time: this.modo === 'tiempo' ? TIME_LIMIT : 0, kills: 0, pts: 0, wave: 0, hp: BASE_HP, maxHp: BASE_HP,
      energy: 100, maxEnergy: 100, weapon: WEAPONS.vacunas.name, nades: 2, maxNades: 2, nadeLoad: 0, level: 1, xp: 0,
      pack: 0, perks: null, charge: 0, end: null, ptsBump: 0, killBump: 0, hit: 0,
    }
  }
  private emit() {
    const p = this.p
    this.ui = {
      ...this.ui, hp: p.hp, maxHp: p.maxHp, energy: Math.floor(p.energy), maxEnergy: p.maxEnergy, weapon: WEAPONS[p.weapon].name,
      nades: p.nades, maxNades: p.maxNades, nadeLoad: p.nades < p.maxNades ? 1 - p.nadeCd / NADE_RECHARGE : 0,
      xp: this.xp / xpFor(this.ui.level), pack: this.allies.length,
    }
    this.onUi(this.ui)
  }

  start(clase: ClaseId = this.clase) {
    cancelAnimationFrame(this.raf)
    this.clase = clase
    const c = CLASES[clase]
    this.p = {
      x: 96, y: 160, flip: false, ax: 1, ay: 0, hp: c.hp, maxHp: c.hp, inv: 0, speed: c.speed,
      weapon: 'vacunas', cd: 0, rate: 1, dmg: c.dmg, extra: 0, energy: 100, maxEnergy: 100, regen: 7,
      nades: c.nades, maxNades: c.nades, nadeCd: NADE_RECHARGE, vacGain: 0.06, pack: 0,
    }
    this.allies = []
    this.blades = 0
    this.bladeHit.clear()
    this.bugs = []
    this.shots = []
    this.warns = []
    this.drops = []
    this.nades = []
    this.foams = []
    this.queue = []
    this.xp = 0
    this.ring = 0
    this.rest = 0
    this.lastTick = 0
    this.firing = false
    this.overlay.querySelectorAll('.pop,.wave-banner').forEach((n) => n.remove())
    this.ui = this.freshUi()
    this.nextWave()
    this.emit()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
    music.setPace(1)
    music.start()
  }

  destroy() {
    music.stop()
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointercancel', this.onUp)
    window.removeEventListener('keydown', this.onKey)
    window.removeEventListener('keyup', this.onKey)
  }

  private get playing() {
    return this.ui.phase === 'play' && !this.ui.perks
  }

  /* ---------- acciones desde los botones ---------- */
  setFiring(on: boolean) {
    this.firing = on
  }

  /** Habilidad de la especialidad elegida; se carga eliminando bichos. */
  skill() {
    if (!this.playing || this.ui.charge < 1) return
    const p = this.p
    this.ui.charge = 0
    if (this.clase === 'clinica') {
      // onda expansiva: daña a todo lo cercano y borra los disparos enemigos
      this.ring = 0.45
      this.shots = this.shots.filter((s) => !s.foe)
      for (const b of [...this.bugs]) if (Math.hypot(b.x - p.x, b.y - p.y) < 72) this.damage(b, 8)
    } else if (this.clase === 'cirujana') {
      this.blades = BLADES
      this.bladeHit.clear()
    } else {
      for (let i = 0; i < 6; i++) {
        const o = { x: p.x + Math.cos((i / 6) * Math.PI * 2) * 34, y: p.y + Math.sin((i / 6) * Math.PI * 2) * 30 }
        keepIn(o, 2)
        this.explode(o.x, o.y)
      }
      p.hp = Math.min(p.maxHp, p.hp + 1)
    }
    sfx.vacuna()
    this.emit()
  }

  /** Tira una granada de detergente al bicho más cercano (o hacia donde mira). */
  grenade() {
    const p = this.p
    if (!this.playing || p.nades < 1) return
    p.nades--
    const t = this.nearest(110)
    const x1 = t ? t.x : p.x + p.ax * 50, y1 = t ? t.y : p.y + p.ay * 50
    const o = { x: x1, y: y1 }
    keepIn(o, 2)
    this.nades.push({ x0: p.x, y0: p.y - 8, x1: o.x, y1: o.y, t: 0 })
    sfx.pop()
    this.emit()
  }

  choosePerk(i: number) {
    const perk = this.perkOpts[i]
    if (!perk || !this.ui.perks) return
    perk.apply(this.p, () => this.adopt())
    this.perkOpts = []
    this.ui.perks = null
    sfx.sparkle()
    this.pop(perk.label, this.p.x, this.p.y - 20, 'good')
    this.last = performance.now()
    this.emit()
  }

  /* ---------- oleadas ---------- */
  private nextWave() {
    const n = this.ui.wave + 1
    this.ui.wave = n
    const q: Kind[] = []
    if (n % 5 === 0) {
      for (let i = 0; i < 1 + 2 * n; i++) q.push('pulga')
    } else {
      for (let i = 0; i < 5 + 2 * n; i++) q.push('pulga')
      for (let i = 0; i < n; i++) q.push('garrapata')
      for (let i = 0; i < n - 1; i++) q.push('mosquito')
    }
    this.queue = q.sort(() => Math.random() - 0.5)
    if (n % 5 === 0) this.queue.unshift('reina')
    this.spawnCd = 0.4
    this.banner(n % 5 === 0 ? '¡GARRAPATA REINA!' : `OLEADA ${n}`)
    music.setPace(Math.min(1.6, 1 + n * 0.035))
    if (n > 1) sfx.ding()
  }
  /** Suma el próximo animal a la manada; entra por la puerta. */
  private adopt() {
    if (this.allies.length >= MAX_PACK) return
    const key = PACK_ORDER.find((k) => !this.allies.some((a) => a.key === k)) ?? pick(PACK_ORDER)
    this.allies.push({ key, x: 96, y: H - 10, flip: false, cd: 0, moving: false })
    this.p.pack = this.allies.length
    this.banner(`¡${ALLIES[key].name.toUpperCase()} SE SUMA!`)
    sfx.ding()
  }
  private waveCleared() {
    this.rest = 2.2
    this.adopt()
    if (this.ui.wave % 3 === 0) {
      const ids = (Object.keys(WEAPONS) as WeaponId[]).filter((w) => w !== 'vacunas' && w !== this.p.weapon)
      this.drops.push({ kind: 'chest', x: 96, y: 150, life: 40, weapon: pick(ids) })
      this.pop('¡Cofre de arma!', 96, 140, 'good')
    }
  }
  private spawnPoint(): number[] {
    const far = SPAWNS.filter(([x, y]) => Math.hypot(x - this.p.x, y - this.p.y) > 50)
    return pick(far.length ? far : SPAWNS)
  }
  private spawn(w: Warn) {
    const k = KINDS[w.k]
    // a partir de la oleada 6 los bichos aguantan más
    const hp = Math.ceil(k.hp * (1 + ((this.ui.wave / 6) | 0) * 0.5) + (w.k === 'reina' ? this.ui.wave * 5 : 0))
    this.bugs.push({ k: w.k, x: w.x, y: w.y, hp, maxHp: hp, cd: 1 + Math.random(), flash: 0, seed: Math.random() * 10 })
  }
  private nearest(range: number): Bug | null {
    const p = this.p
    let near: Bug | null = null, best = range
    for (const b of this.bugs) {
      const d = Math.hypot(b.x - p.x, b.y - (p.y - 8))
      if (d < best) { best = d; near = b }
    }
    return near
  }

  /* ---------- daño ---------- */
  private damage(b: Bug, n: number) {
    if (!this.bugs.includes(b)) return
    b.hp -= n
    b.flash = 0.12
    if (b.hp > 0) return
    this.bugs.splice(this.bugs.indexOf(b), 1)
    const k = KINDS[b.k]
    sfx.squish()
    this.pop(`+${k.pts}`, b.x, b.y - 6, 'good')
    this.ui.kills++
    this.ui.pts += k.pts
    this.ui.killBump++
    this.ui.ptsBump++
    this.ui.charge = Math.min(1, this.ui.charge + this.p.vacGain)
    if (Math.random() < 0.05 || b.k === 'reina') this.drops.push({ kind: 'heart', x: b.x, y: b.y, life: 8 })
    this.gainXp(k.xp)
  }
  private gainXp(n: number) {
    this.xp += n
    if (this.xp < xpFor(this.ui.level)) return
    this.xp -= xpFor(this.ui.level)
    this.ui.level++
    const ok = PERKS.filter((k) => k.ok(this.p)).sort(() => Math.random() - 0.5).slice(0, 3)
    if (!ok.length) return
    this.perkOpts = ok
    this.ui.perks = ok.map(({ label, desc }) => ({ label, desc }))
    this.joy = null
    this.firing = false
    this.keys.clear()
    sfx.sparkle()
  }
  private hurt(fromX: number, fromY: number) {
    const p = this.p
    if (p.inv > 0 || this.ui.phase !== 'play') return
    p.hp--
    p.inv = 1
    const d = Math.hypot(p.x - fromX, p.y - fromY) || 1
    p.x += ((p.x - fromX) / d) * 8
    p.y += ((p.y - fromY) / d) * 8
    keepIn(p, 4)
    sfx.bad()
    this.ui.hit++
    if (p.hp <= 0) this.finish('dead')
    else this.emit()
  }
  private finish(end: 'dead' | 'time') {
    this.ui.phase = 'over'
    this.ui.end = end
    this.ui.perks = null
    if (end === 'time') this.ui.time = 0
    this.joy = null
    this.firing = false
    music.stop()
    sfx.end(this.ui.wave >= 10 ? 2 : this.ui.wave >= 5 ? 1 : 0)
    this.emit()
  }
  private explode(x: number, y: number) {
    for (const b of [...this.bugs]) if (Math.hypot(b.x - x, b.y - y) < BLAST + KINDS[b.k].r) this.damage(b, 4 + this.p.dmg)
    this.foams.push({ x, y, life: 2.5, tick: 0.5 })
    sfx.squish()
    sfx.bad()
  }

  /* ---------- textos sobre el canvas ---------- */
  private pop(text: string, x: number, y: number, cls: string) {
    const p = document.createElement('div')
    p.className = 'pop ' + cls
    p.textContent = text
    p.style.left = (x / W) * 100 + '%'
    p.style.top = (y / H) * 100 + '%'
    this.overlay.append(p)
    window.setTimeout(() => p.remove(), 1050)
  }
  private banner(text: string) {
    this.overlay.querySelectorAll('.wave-banner').forEach((n) => n.remove())
    const b = document.createElement('div')
    b.className = 'wave-banner'
    b.textContent = text
    this.overlay.append(b)
    window.setTimeout(() => b.remove(), 1600)
  }

  /* ---------- controles ---------- */
  private logical(ev: PointerEvent) {
    const r = this.canvas.getBoundingClientRect()
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H]
  }
  private onDown = (ev: PointerEvent) => {
    if (!this.playing || this.joy) return
    ev.preventDefault()
    this.canvas.setPointerCapture(ev.pointerId)
    const [x, y] = this.logical(ev)
    this.joy = { id: ev.pointerId, ox: x, oy: y, x, y }
  }
  private onMove = (ev: PointerEvent) => {
    if (!this.joy || ev.pointerId !== this.joy.id) return
    const [x, y] = this.logical(ev)
    this.joy.x = x
    this.joy.y = y
  }
  private onUp = (ev: PointerEvent) => {
    if (this.joy && ev.pointerId === this.joy.id) this.joy = null
  }
  private onKey = (ev: KeyboardEvent) => {
    if ((ev.target as HTMLElement | null)?.tagName === 'INPUT') return
    const k = ev.key.toLowerCase(), down = ev.type === 'keydown'
    if (k === 'j' || k === 'z') {
      ev.preventDefault()
      return this.setFiring(down)
    }
    if (down && (k === 'k' || k === 'x')) return this.grenade()
    if (down && (k === ' ' || k === 'l' || k === 'c')) {
      ev.preventDefault()
      return this.skill()
    }
    if (!['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) return
    ev.preventDefault()
    if (down) this.keys.add(k)
    else this.keys.delete(k)
  }
  /** Dirección pedida por el jugador, con largo entre 0 y 1. */
  private input(): number[] {
    let dx = 0, dy = 0
    const k = this.keys
    if (k.has('a') || k.has('arrowleft')) dx--
    if (k.has('d') || k.has('arrowright')) dx++
    if (k.has('w') || k.has('arrowup')) dy--
    if (k.has('s') || k.has('arrowdown')) dy++
    if (this.joy) {
      dx += (this.joy.x - this.joy.ox) / 18
      dy += (this.joy.y - this.joy.oy) / 18
    }
    const d = Math.hypot(dx, dy)
    return d > 1 ? [dx / d, dy / d] : d < 0.12 ? [0, 0] : [dx, dy]
  }

  /* ---------- loop ---------- */
  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    if (this.playing) this.update(dt, now / 1000)
    this.render(now / 1000)
    if (this.playing && now - this.lastEmit > 100) {
      this.lastEmit = now
      this.emit()
    } else if (this.ui.perks && now - this.lastEmit > 100) {
      // queda en pausa hasta que se elija la mejora
      this.lastEmit = now
      this.emit()
    }
    this.raf = requestAnimationFrame(this.frame)
  }

  private shoot() {
    const p = this.p, w = WEAPONS[p.weapon]
    if (p.cd > 0) return
    if (p.energy < w.cost) {
      // sin energía vuelve a la pistola de vacunas, que no gasta
      p.weapon = 'vacunas'
      this.pop('¡Sin energía!', p.x, p.y - 20, 'bad')
      return this.emit()
    }
    p.energy -= w.cost
    p.cd = 1 / (w.rate * p.rate)
    const t = this.nearest(140)
    if (t) {
      const d = Math.hypot(t.x - p.x, t.y - (p.y - 8)) || 1
      p.ax = (t.x - p.x) / d
      p.ay = (t.y - (p.y - 8)) / d
    }
    p.flip = p.ax < 0
    const a = Math.atan2(p.ay, p.ax), n = w.pellets + p.extra
    for (let i = 0; i < n; i++) {
      const o = a + (n > 1 ? (i / (n - 1) - 0.5) * Math.max(w.spread, 0.16 * (n - 1)) : 0) + (Math.random() - 0.5) * w.spread * 0.3
      this.shots.push({
        x: p.x + p.ax * 6, y: p.y - 8 + p.ay * 6, vx: Math.cos(o) * w.speed, vy: Math.sin(o) * w.speed, dmg: w.dmg + p.dmg,
        life: w.life, foe: false, pierce: w.pierce ? new Set() : undefined, color: w.color,
      })
    }
    sfx.shot()
  }

  private update(dt: number, t: number) {
    const p = this.p, ui = this.ui
    if (this.modo === 'tiempo') {
      ui.time = Math.max(0, ui.time - dt)
      const secs = Math.ceil(ui.time)
      if (secs <= 10 && secs > 0 && secs !== this.lastTick) {
        this.lastTick = secs
        sfx.tick(secs <= 3)
      }
      if (ui.time <= 0) return this.finish('time')
    } else ui.time += dt

    // jugador
    const [mx, my] = this.input()
    p.x += mx * p.speed * dt
    p.y += my * p.speed * dt
    if (mx || my) {
      const d = Math.hypot(mx, my)
      p.ax = mx / d
      p.ay = my / d
      if (Math.abs(mx) > 0.1) p.flip = mx < 0
    }
    keepIn(p, 4)
    p.inv = Math.max(0, p.inv - dt)
    p.cd -= dt
    p.energy = Math.min(p.maxEnergy, p.energy + p.regen * dt)
    if (p.nades < p.maxNades) {
      p.nadeCd -= dt
      if (p.nadeCd <= 0) {
        p.nades++
        p.nadeCd = NADE_RECHARGE
      }
    }
    this.ring = Math.max(0, this.ring - dt)
    if (this.blades > 0) {
      this.blades -= dt
      for (let i = 0; i < 4; i++) {
        const a = t * 6 + (i / 4) * Math.PI * 2, bx = p.x + Math.cos(a) * 18, by = p.y - 6 + Math.sin(a) * 18
        for (const b of [...this.bugs]) {
          if (Math.hypot(b.x - bx, b.y - 3 - by) > KINDS[b.k].r + 4 || (this.bladeHit.get(b) ?? 0) > t) continue
          this.bladeHit.set(b, t + 0.3)
          this.damage(b, 2 + p.dmg)
        }
      }
    }
    if (this.firing) this.shoot()

    // oleadas: entran en grupitos por la puerta y los costados
    if (this.rest > 0) {
      this.rest -= dt
      if (this.rest <= 0) this.nextWave()
    } else {
      this.spawnCd -= dt
      if (this.spawnCd <= 0 && this.queue.length && this.bugs.length + this.warns.length < MAX_BUGS) {
        const [x, y] = this.spawnPoint()
        const group = Math.min(this.queue.length, this.queue[0] === 'reina' ? 1 : 2 + ((Math.random() * 3) | 0))
        for (let i = 0; i < group; i++)
          this.warns.push({ k: this.queue.shift()!, x: x + (Math.random() - 0.5) * 16, y: y + (Math.random() - 0.5) * 16, t: 0.7 })
        this.spawnCd = Math.max(0.35, 1.1 - ui.wave * 0.05)
      }
      if (!this.queue.length && !this.warns.length && !this.bugs.length) this.waveCleared()
    }
    for (const w of [...this.warns]) {
      w.t -= dt
      if (w.t <= 0) {
        this.warns.splice(this.warns.indexOf(w), 1)
        this.spawn(w)
      }
    }

    // espuma de detergente: daña y frena
    for (const f of [...this.foams]) {
      f.life -= dt
      f.tick -= dt
      if (f.tick <= 0) {
        f.tick = 0.5
        for (const b of [...this.bugs]) if (Math.hypot(b.x - f.x, b.y - f.y) < BLAST) this.damage(b, 1)
      }
      if (f.life <= 0) this.foams.splice(this.foams.indexOf(f), 1)
    }

    // granadas en el aire
    for (const g of [...this.nades]) {
      g.t += dt / 0.45
      if (g.t >= 1) {
        this.nades.splice(this.nades.indexOf(g), 1)
        this.explode(g.x1, g.y1)
      }
    }

    // bichos
    for (const b of this.bugs) {
      const k = KINDS[b.k]
      b.flash = Math.max(0, b.flash - dt)
      b.cd -= dt
      const dx = p.x - b.x, dy = p.y - 4 - b.y, d = Math.hypot(dx, dy) || 1
      let vx = dx / d, vy = dy / d, sp = k.speed
      if (b.k === 'pulga') sp *= Math.sin(t * 7 + b.seed) > 0 ? 1.9 : 0.25
      if (b.k === 'mosquito') {
        // se mantiene a distancia, da vueltas y pica de lejos
        const away = d < 55 ? -1 : d > 75 ? 1 : 0
        vx = vx * away - vy * 0.8
        vy = vy * away + (dx / d) * 0.8
        if (b.cd <= 0) {
          b.cd = 2.2
          this.shots.push({ x: b.x, y: b.y, vx: (dx / d) * 60, vy: (dy / d) * 60, dmg: 1, life: 3, foe: true })
        }
      }
      if (b.k === 'reina' && b.cd <= 0) {
        b.cd = 2.6
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + t
          this.shots.push({ x: b.x, y: b.y - 6, vx: Math.cos(a) * 55, vy: Math.sin(a) * 55, dmg: 1, life: 4, foe: true })
        }
      }
      if (this.foams.some((f) => Math.hypot(b.x - f.x, b.y - f.y) < BLAST)) sp *= 0.45
      b.x += vx * sp * dt
      b.y += vy * sp * dt
      // se separan entre ellos para no apilarse
      for (const o of this.bugs) {
        if (o === b) continue
        const ex = b.x - o.x, ey = b.y - o.y, e = Math.hypot(ex, ey), min = k.r + KINDS[o.k].r
        if (e > 0 && e < min) {
          b.x += (ex / e) * (min - e) * 0.5
          b.y += (ey / e) * (min - e) * 0.5
        }
      }
      keepIn(b, k.r)
      if (Math.hypot(p.x - b.x, p.y - 4 - b.y) < k.r + 4) this.hurt(b.x, b.y)
    }

    // manada: cada animal va al bicho más cercano sin alejarse del veterinario, o vuelve a su lado
    this.allies.forEach((a, i) => {
      const s = ALLIES[a.key]
      a.cd -= dt
      let target: Bug | null = null, best = s.ranged ? 90 : 70
      for (const b of this.bugs) {
        if (Math.hypot(b.x - p.x, b.y - p.y) > 90) continue
        const d = Math.hypot(b.x - a.x, b.y - a.y)
        if (d < best) { best = d; target = b }
      }
      const ang = (i / this.allies.length) * Math.PI * 2 + 0.6
      const [tx, ty] = target && !s.ranged ? [target.x, target.y] : [p.x + Math.cos(ang) * 22, p.y + Math.sin(ang) * 16]
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy)
      a.moving = d > 3
      if (a.moving) {
        const step = Math.min(d, s.speed * dt)
        a.x += (dx / d) * step
        a.y += (dy / d) * step
        if (Math.abs(dx) > 0.5) a.flip = dx < 0
      }
      keepIn(a, 4)
      if (!target || a.cd > 0) return
      if (s.ranged) {
        const e = Math.hypot(target.x - a.x, target.y - a.y) || 1
        a.flip = target.x < a.x
        this.shots.push({ x: a.x, y: a.y - 8, vx: ((target.x - a.x) / e) * 150, vy: ((target.y - a.y) / e) * 150, dmg: s.dmg, life: 0.8, foe: false, color: '#ff8fd0' })
        a.cd = 1 / s.rate
      } else if (Math.hypot(target.x - a.x, target.y - a.y) < KINDS[target.k].r + 8) {
        this.damage(target, s.dmg)
        a.cd = 1 / s.rate
      }
    })

    // disparos
    for (const s of [...this.shots]) {
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt
      let gone = s.life <= 0 || s.x < 4 || s.x > W - 4 || s.y < TOP - 6 || s.y > H || inDesk(s.x, s.y)
      if (!gone && s.foe && Math.hypot(s.x - p.x, s.y - (p.y - 6)) < 5) {
        this.hurt(s.x, s.y)
        gone = true
      }
      if (!gone && !s.foe) {
        const hit = this.bugs.find((b) => !s.pierce?.has(b) && Math.hypot(s.x - b.x, s.y - (b.y - 3 * KINDS[b.k].scale)) < KINDS[b.k].r + 2)
        if (hit) {
          if (s.pierce) s.pierce.add(hit)
          else gone = true
          this.damage(hit, s.dmg)
        }
      }
      if (gone) this.shots.splice(this.shots.indexOf(s), 1)
    }

    // corazones y cofres
    for (const d of [...this.drops]) {
      d.life -= dt
      const got = Math.hypot(d.x - p.x, d.y - p.y) < 10
      if (got && d.kind === 'heart' && p.hp < p.maxHp) {
        p.hp++
        sfx.coin(false)
        this.pop('+♥', d.x, d.y - 6, 'good')
      } else if (got && d.kind === 'chest' && d.weapon) {
        p.weapon = d.weapon
        p.energy = p.maxEnergy
        sfx.sparkle()
        this.banner(WEAPONS[d.weapon].name.toUpperCase())
      } else if (d.life > 0) continue
      this.drops.splice(this.drops.indexOf(d), 1)
      this.emit()
    }
  }

  /* ---------- dibujo ---------- */
  private sprite(c: HTMLCanvasElement, x: number, y: number, scale = 1) {
    this.ctx.drawImage(c, Math.round(x - (c.width * scale) / 2), Math.round(y - c.height * scale), c.width * scale, c.height * scale)
  }

  private drawRoom(t: number) {
    // piso
    for (let j = 0; j * 12 < H; j++)
      for (let i = 0; i * 12 < W; i++) R(i * 12, j * 12, 12, 12, (i + j) % 2 ? '#f5e8cb' : '#ecd9b2')
    // pared con zócalo
    R(0, 0, W, TOP - 4, '#fbe3a6')
    R(0, TOP - 10, W, 6, '#c88a52'); R(0, TOP - 10, W, 1, '#e0a46b')
    R(0, TOP - 4, W, 2, 'rgba(26,22,38,.14)')
    // ventanas y cuadro
    for (const x of [18, 150]) {
      R(x, 4, 24, 12, INK); R(x + 1, 5, 22, 10, '#8fd3ff'); R(x + 1, 5, 22, 3, '#d3eeff'); R(x + 12, 5, 1, 10, INK)
    }
    R(84, 4, 24, 12, INK); R(85, 5, 22, 10, '#fff5df'); R(88, 8, 3, 3, '#ff9ab0'); R(93, 7, 3, 3, '#ff9ab0'); R(98, 8, 3, 3, '#ff9ab0'); R(92, 11, 6, 3, '#ff9ab0')
    // bordes y puerta
    R(0, TOP - 4, 4, H, '#3b3352'); R(W - 4, TOP - 4, 4, H, '#3b3352')
    R(78, H - 4, 36, 4, '#7a4b2a')
    ;([[12, 46], [180, 46], [12, 244], [180, 244]] as const).forEach(([x, y]) => drawPlant(x, y, t))
    drawDesk()
  }

  /** Arma en la mano del veterinario, apuntando hacia donde mira. */
  private drawWeapon(p: Player) {
    const w = WEAPONS[p.weapon]
    const hx = p.x + (p.flip ? -3 : 3), hy = p.y - 8
    const len = p.weapon === 'jeringota' ? 9 : p.weapon === 'escopeta' ? 8 : 6
    for (let i = 0; i < len; i++) R(hx + p.ax * i - 1, hy + p.ay * i - 1, 3, 3, INK)
    for (let i = 0; i < len - 1; i++) R(hx + p.ax * i, hy + p.ay * i, 1, 1, i < 2 ? '#a7afc2' : w.color)
    R(hx + p.ax * len, hy + p.ay * len, 1, 1, '#fff5df')
  }

  private render(t: number) {
    const ctx = this.ctx, p = this.p
    setCtx(ctx)
    this.drawRoom(t)

    // espuma de detergente
    for (const f of this.foams) {
      ctx.globalAlpha = Math.min(1, f.life) * 0.75
      circle(Math.round(f.x), Math.round(f.y), BLAST - 4, '#d3eeff')
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4 + f.x, r = (i * 7) % (BLAST - 6)
        circle(Math.round(f.x + Math.cos(a) * r), Math.round(f.y + Math.sin(a) * r * 0.8 + Math.sin(t * 3 + i) * 1), 2 + (i % 3), '#ffffff')
      }
      ctx.globalAlpha = 1
    }

    // avisos de bicho entrando
    for (const w of this.warns) {
      if (((w.t * 10) | 0) % 2) continue
      const c = '#ff6b6b'
      R(w.x - 4, w.y - 4, 2, 2, c); R(w.x + 2, w.y - 4, 2, 2, c); R(w.x - 1, w.y - 1, 2, 2, c); R(w.x - 4, w.y + 2, 2, 2, c); R(w.x + 2, w.y + 2, 2, 2, c)
    }

    for (const d of this.drops) {
      if (d.life < 2 && ((d.life * 8) | 0) % 2) continue
      const bob = Math.round(Math.sin(t * 4 + d.x) * 1)
      shadow(d.x, d.y, d.kind === 'chest' ? 16 : 8)
      if (d.kind === 'heart') this.sprite(HEART, d.x, d.y - 1 + bob)
      else {
        R(d.x - 8, d.y - 12 + bob, 16, 11, INK); R(d.x - 7, d.y - 11 + bob, 14, 9, '#c88a52'); R(d.x - 7, d.y - 11 + bob, 14, 3, '#e0a46b')
        R(d.x - 7, d.y - 8 + bob, 14, 1, INK); R(d.x - 1, d.y - 9 + bob, 3, 3, '#ffc94a')
        if (((t * 4) | 0) % 2) R(d.x - 1, d.y - 15 + bob, 2, 2, '#fff3b8')
      }
    }

    // bichos y veterinario, de atrás para adelante
    const order: { y: number; draw: () => void }[] = this.bugs.map((b) => ({
      y: b.y,
      draw: () => {
        const k = KINDS[b.k]
        shadow(b.x, b.y, k.r * 2 + 2)
        if (b.flash > 0 && ((t * 30) | 0) % 2) return
        const hop = b.k === 'pulga' && Math.sin(t * 7 + b.seed) > 0 ? 2 : b.k === 'mosquito' ? 4 + Math.round(Math.sin(t * 12 + b.seed)) : 0
        this.sprite(SPR[b.k], b.x, b.y - hop, k.scale)
        if (b.k === 'reina') {
          R(b.x - 6, b.y - 24, 12, 4, INK); R(b.x - 5, b.y - 23, 10, 2, '#ffc94a')
          R(b.x - 5, b.y - 26, 2, 2, '#ffc94a'); R(b.x - 1, b.y - 27, 2, 3, '#ffc94a'); R(b.x + 3, b.y - 26, 2, 2, '#ffc94a')
        }
      },
    }))
    for (const a of this.allies) {
      order.push({
        y: a.y,
        draw: () => {
          const spr = a.flip ? PETS[a.key].f : PETS[a.key].c
          const bob = a.moving ? ((t * 10 + a.x) | 0) % 2 : 0
          shadow(a.x, a.y, 12)
          ctx.drawImage(spr, Math.round(a.x - spr.width / 2), Math.round(a.y - spr.height - bob))
        },
      })
    }
    const [mx, my] = this.input()
    order.push({
      y: p.y,
      draw: () => {
        shadow(p.x, p.y, 10)
        if (p.inv > 0 && ((t * 16) | 0) % 2) return
        const blink = t % 3.2 < 0.12
        const vet = this.vet
        const s = p.flip ? (blink ? vet.blinkF : vet.openF) : blink ? vet.blink : vet.open
        const bob = mx || my ? ((t * 9) | 0) % 2 : 0
        ctx.drawImage(s, Math.round(p.x - 6), Math.round(p.y - 18 - bob))
        this.drawWeapon(p)
      },
    })
    order.sort((a, b) => a.y - b.y).forEach((o) => o.draw())

    for (const s of this.shots) {
      if (s.foe) {
        circle(Math.round(s.x), Math.round(s.y), 2, INK)
        R(s.x - 1, s.y - 1, 2, 2, '#9be15d')
      } else {
        const l = Math.hypot(s.vx, s.vy)
        const ux = s.vx / l, uy = s.vy / l
        R(s.x - ux * 4, s.y - uy * 4, 2, 2, '#fff5df')
        R(s.x - ux * 2, s.y - uy * 2, 2, 2, '#fff5df')
        R(s.x, s.y, 2, 2, s.color || '#63dfb0')
      }
    }

    // granadas: botella de detergente en arco
    for (const g of this.nades) {
      const x = g.x0 + (g.x1 - g.x0) * g.t, y = g.y0 + (g.y1 - g.y0) * g.t - Math.sin(g.t * Math.PI) * 22
      shadow(g.x0 + (g.x1 - g.x0) * g.t, g.y0 + 8 + (g.y1 - g.y0 - 8) * g.t, 6)
      this.sprite(BOTTLE, x, y + 3)
    }

    if (this.blades > 0) {
      for (let i = 0; i < 4; i++) {
        const a = t * 6 + (i / 4) * Math.PI * 2, bx = p.x + Math.cos(a) * 18, by = p.y - 6 + Math.sin(a) * 18
        if (this.blades < 1.2 && ((t * 10) | 0) % 2) continue
        R(bx - 2, by - 2, 5, 5, INK); R(bx - 1, by - 1, 3, 3, '#d4dae6'); R(bx, by, 1, 1, '#ffffff')
      }
    }

    if (this.ring > 0) {
      const r = Math.round(72 * (1 - this.ring / 0.45))
      ctx.globalAlpha = this.ring / 0.45
      ctx.strokeStyle = '#63dfb0'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(p.x, p.y - 6, r, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // vida de la reina
    const boss = this.bugs.find((b) => b.k === 'reina')
    if (boss) {
      R(30, TOP + 2, 132, 5, INK)
      R(31, TOP + 3, Math.round(130 * (boss.hp / boss.maxHp)), 3, '#e06a8a')
    }

    if (this.joy) {
      const j = this.joy
      ctx.globalAlpha = 0.35
      circle(Math.round(j.ox), Math.round(j.oy), 16, '#fff5df')
      ctx.globalAlpha = 0.7
      const dx = j.x - j.ox, dy = j.y - j.oy, d = Math.hypot(dx, dy), m = Math.min(d, 16) / (d || 1)
      circle(Math.round(j.ox + dx * m), Math.round(j.oy + dy * m), 7, '#ffc94a')
      ctx.globalAlpha = 1
    }
  }
}
