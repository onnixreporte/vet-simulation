import { getCases, type Case, type RoomId } from './cases'
import { ROOM, FACE, R, drawClinic, drawDesk, setCtx, shadow, W, H } from './draw'
import { OWNERS, PETS, VET, type Animal, type Person } from './sprites'

export const TOTAL_TIME = 90

export type Phase = 'idle' | 'arriving' | 'triage' | 'diag' | 'send' | 'moving' | 'over'
export type SheetState = 'closed' | 'open' | 'mini'

export interface Option {
  label: string
  kind: 'yes' | 'no' | 'dx'
  mark?: 'right' | 'wrong'
  disabled?: boolean
}

export interface Ui {
  phase: Phase
  time: number
  pts: number
  count: number
  num: number
  sheet: SheetState
  /** Texto de ayuda; lo que va entre *asteriscos* se resalta. */
  hint: string
  ficha: { c: Case; owner: Person } | null
  question: string
  options: Option[]
  stars: number
  /** Contadores que cambian para disparar animaciones en la UI. */
  ptsBump: number
  countBump: number
  hit: number
}

interface Ent {
  c: Case
  owner: Person
  pet: Animal
  x: number
  y: number
  path: number[][]
  speed: number
  flip: boolean
  moving: boolean
  blinkAt: number
  onArrive: (() => void) | null
  room: RoomId | null
  settled?: boolean
  lift?: boolean
  queueSpot?: number
}

const ROOMS: Record<RoomId, { label: string; path: number[][]; area: number[] }> = {
  banos: { label: 'Baños', path: [[48, 120], [48, 84], [48, 64]], area: [8, 46, 80, 26] },
  perros: { label: 'Sala de mascotas', path: [[144, 120], [144, 84], [144, 64]], area: [104, 40, 70, 28] },
  quirofano: { label: 'Quirófano', path: [[48, 150], [48, 176], [48, 200]], area: [30, 190, 30, 10] },
  espera: { label: 'Sala de espera', path: [[144, 150], [144, 178], [140, 222]], area: [128, 214, 40, 26] },
}
const COUNTER = [96, 136]
const BENCH = [[132, 210], [158, 210], [178, 244]]
const ROOM_IDS: RoomId[] = ['banos', 'perros', 'quirofano', 'espera']

const shuffle = <T,>(a: T[]) => {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}
const pick = <T,>(a: T[]) => a[(Math.random() * a.length) | 0]

export class GameEngine {
  private ctx: CanvasRenderingContext2D
  private ents: Ent[] = []
  private queue: Ent[] = []
  private cur: Ent | null = null
  private hover: RoomId | null = null
  private drag: { id: number; dx: number; dy: number } | null = null
  private dxOk: boolean[] = []
  private deck: Record<'comunes' | 'raros', Case[]> = { comunes: [], raros: [] }
  private raf = 0
  private last = 0
  private lastEmit = 0
  private timers: number[] = []
  ui: Ui

  private canvas: HTMLCanvasElement
  private overlay: HTMLElement
  private onUi: (ui: Ui) => void

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement, onUi: (ui: Ui) => void) {
    this.canvas = canvas
    this.overlay = overlay
    this.onUi = onUi
    this.ctx = canvas.getContext('2d')!
    this.ui = this.freshUi()
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onUp)
  }

  private freshUi(): Ui {
    return {
      phase: 'idle', time: TOTAL_TIME, pts: 0, count: 0, num: 0, sheet: 'closed', hint: '', ficha: null,
      question: '', options: [], stars: 0, ptsBump: 0, countBump: 0, hit: 0,
    }
  }
  private set(patch: Partial<Ui>) {
    this.ui = { ...this.ui, ...patch }
    this.onUi(this.ui)
  }
  private later(fn: () => void, ms: number) {
    this.timers.push(window.setTimeout(fn, ms))
  }

  start() {
    this.stopLoop()
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.ents = []
    this.queue = []
    this.cur = null
    this.hover = null
    this.drag = null
    this.overlay.querySelectorAll('.bubble,.pop').forEach((n) => n.remove())
    this.set(this.freshUi())
    this.nextPatient()
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.stopLoop()
    this.timers.forEach(clearTimeout)
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointercancel', this.onUp)
  }
  private stopLoop() {
    cancelAnimationFrame(this.raf)
  }

  /* ---------- acciones desde la ficha ---------- */
  choose(i: number) {
    if (this.ui.phase === 'triage') return i === 0 ? this.askDx() : this.sendToWait()
    if (this.ui.phase !== 'diag' || !this.cur) return
    const ok = this.dxOk[i]
    const c = this.cur.c
    this.set({ options: this.ui.options.map((o, k) => ({ ...o, disabled: true, mark: k === i ? (ok ? 'right' : 'wrong') : undefined })) })
    if (ok) this.award(c.raro ? 100 : 50, [96, 110])
    else this.penalty(5, [96, 110])
    this.later(() => this.askSend(), 500)
  }
  toggleSheet() {
    this.set({ sheet: this.ui.sheet === 'open' ? 'mini' : 'open' })
  }

  /* ---------- flujo ---------- */
  private newEnt(c: Case): Ent {
    return { c, owner: pick(OWNERS), pet: PETS[c.pet], x: 200, y: 236, path: [], speed: 46, flip: true, moving: false,
      blinkAt: Math.random() * 3, onArrive: null, room: null }
  }
  private moveTo(e: Ent, pts: number[][], cb?: (() => void) | null, speed = 46) {
    e.path = pts.map((p) => [...p])
    e.onArrive = cb || null
    e.speed = speed
  }

  /**
   * Saca el próximo caso de un mazo mezclado: no se repite ninguno hasta agotar el mazo
   * y nunca sale uno que ya está en pantalla. El mazo sigue entre turnos.
   */
  private draw(raro: boolean): Case {
    const all = getCases()
    const raros = all.filter((c) => c.raro), comunes = all.filter((c) => !c.raro)
    const key = raro && raros.length ? 'raros' : 'comunes'
    const src = key === 'raros' ? raros : comunes.length ? comunes : all
    const busy = new Set([this.cur?.c, ...this.queue.map((e) => e.c)])
    // si los casos se recargaron, descarta los que ya no existen
    let deck = this.deck[key].filter((c) => src.includes(c))
    if (!deck.some((c) => !busy.has(c))) deck = shuffle(src)
    const i = Math.max(0, deck.findIndex((c) => !busy.has(c)))
    const [c] = deck.splice(i, 1)
    this.deck[key] = deck
    return c
  }

  private refillQueue() {
    while (this.queue.length < BENCH.length) {
      const n = this.ui.num + this.queue.length + 1
      const e = this.newEnt(this.draw(n % 4 === 0))
      this.queue.push(e)
      this.ents.push(e)
    }
    this.queue.forEach((e, i) => {
      if (!e.path.length || e.queueSpot !== i) {
        e.queueSpot = i
        // un paciente que vuelve de "que espere" puede dejar la fila con uno de más
        this.moveTo(e, [BENCH[Math.min(i, BENCH.length - 1)]])
      }
    })
  }

  private nextPatient() {
    if (this.ui.phase === 'over') return
    if (!this.queue.length) this.refillQueue()
    const e = this.queue.shift()!
    this.cur = e
    this.set({ num: this.ui.num + 1, phase: 'arriving', sheet: 'closed', hint: 'Llega un paciente...' })
    this.moveTo(e, [[144, 186], [144, 160], [118, 140], COUNTER], () => {
      if (this.ui.phase === 'over') return
      this.say(e.c.dice, e)
      this.set({ ficha: { c: e.c, owner: e.owner } })
      this.askAttend()
    }, 58)
    this.later(() => this.refillQueue(), 300)
  }

  private askAttend() {
    this.set({
      phase: 'triage', question: '¿Atender?', hint: 'Leé la ficha y decidí. *¡Rápido!*', sheet: 'open',
      options: [{ label: 'Sí, que pase', kind: 'yes' }, { label: 'Que espere', kind: 'no' }],
    })
  }
  private sendToWait() {
    const e = this.cur!
    this.say('')
    this.set({ phase: 'moving', sheet: 'closed' })
    this.moveTo(e, [[118, 140], [144, 160], [144, 186], [178, 244]], () => {
      this.queue.push(e)
      this.set({ num: this.ui.num - 1 })
      this.nextPatient()
    }, 60)
  }
  private askDx() {
    const c = this.cur!.c
    const opts = shuffle(c.dx.map((d, i) => ({ label: d, ok: i === 0 })))
    this.dxOk = opts.map((o) => o.ok)
    this.set({ phase: 'diag', question: '¿Cuál es la respuesta?', hint: 'Elegí el diagnóstico.', options: opts.map((o) => ({ label: o.label, kind: 'dx' })) })
  }
  private askSend() {
    if (this.ui.phase === 'over') return
    this.say('')
    this.set({ phase: 'send', sheet: 'mini', hint: '*Arrastrá* al paciente a una sala, o *tocá* la sala.' })
    this.canvas.classList.add('can-grab')
  }

  private resolveRoom(id: RoomId, dropped = false) {
    if (this.ui.phase !== 'send' || !this.cur) return
    const e = this.cur, c = e.c, R0 = ROOMS[id], r = ROOM[id]
    this.canvas.classList.remove('can-grab')
    this.hover = null
    const at = [r.x + r.w / 2, r.y + r.h / 2]
    if (id === c.room) {
      this.set({ phase: 'moving', sheet: 'closed', count: this.ui.count + 1, countBump: this.ui.countBump + 1, hint: `¡Bien! ${c.n} va a ${R0.label}.` })
      this.award(c.raro ? 200 : 100, at)
      e.room = id
      const done = () => this.settle(id, e)
      if (dropped) {
        // soltado dentro de la sala: se queda donde lo dejaron
        const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
        this.moveTo(e, [[cl(e.x, r.x + 16, r.x + r.w - 18), cl(e.y, r.y + FACE + 20, r.y + r.h - 3)]], done, 70)
      } else {
        const [ax, ay, aw, ah] = R0.area
        this.moveTo(e, [...R0.path.slice(0, -1), [ax + Math.random() * aw, ay + Math.random() * ah]], done, 70)
      }
      this.later(() => this.nextPatient(), 700)
    } else {
      this.penalty(10, at)
      this.set({ hint: `${c.n} no va a ${R0.label}. *Probá otra sala.*` })
      this.moveTo(e, [COUNTER], () => {
        if (this.ui.phase === 'send') this.canvas.classList.add('can-grab')
      }, 160)
    }
  }
  private settle(id: RoomId, e: Ent) {
    const here = this.ents.filter((x) => x.room === id && x.settled)
    e.settled = true
    if (here.length >= 3) this.ents = this.ents.filter((x) => x !== here[0])
  }

  private endGame() {
    this.canvas.classList.remove('can-grab')
    this.say('')
    const p = this.ui.pts
    this.set({ phase: 'over', sheet: 'closed', stars: p >= 1200 ? 3 : p >= 500 ? 2 : p > 0 ? 1 : 0 })
  }

  /* ---------- feedback ---------- */
  private pct(x: number, y: number) {
    return [(x / W) * 100, (y / H) * 100]
  }
  private pop(text: string, [x, y]: number[], cls: string) {
    const p = document.createElement('div')
    p.className = 'pop ' + cls
    p.textContent = text
    const [px, py] = this.pct(x, y)
    p.style.left = px + '%'
    p.style.top = py + '%'
    this.overlay.append(p)
    window.setTimeout(() => p.remove(), 1050)
  }
  private say(text: string, e?: Ent) {
    this.overlay.querySelectorAll('.bubble').forEach((b) => b.remove())
    if (!text || !e) return
    const b = document.createElement('div')
    b.className = 'bubble'
    b.textContent = text
    const [px, py] = this.pct(e.x - 2, e.y - 24)
    b.style.left = px + '%'
    b.style.bottom = 100 - py + '%'
    this.overlay.append(b)
  }
  private penalty(sec: number, at: number[]) {
    try {
      navigator.vibrate?.(120)
    } catch {
      /* algunos navegadores no lo permiten */
    }
    this.pop(`-${sec}s`, at, 'bad')
    this.set({ time: Math.max(0, this.ui.time - sec), hit: this.ui.hit + 1 })
  }
  private award(n: number, at: number[]) {
    this.pop(`+${n}`, at, 'good')
    this.set({ pts: this.ui.pts + n, ptsBump: this.ui.ptsBump + 1 })
  }

  /* ---------- puntero ---------- */
  private logical(ev: PointerEvent) {
    const r = this.canvas.getBoundingClientRect()
    return [((ev.clientX - r.left) / r.width) * W, ((ev.clientY - r.top) / r.height) * H]
  }
  private roomAt(x: number, y: number): RoomId | null {
    for (const k of ROOM_IDS) {
      const r = ROOM[k]
      if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return k
    }
    return null
  }
  private onDown = (ev: PointerEvent) => {
    if (this.ui.phase !== 'send' || !this.cur) return
    const [x, y] = this.logical(ev), e = this.cur
    if (Math.abs(x - (e.x + 2)) < 22 && y > e.y - 30 && y < e.y + 8) {
      ev.preventDefault()
      this.canvas.setPointerCapture(ev.pointerId)
      this.drag = { id: ev.pointerId, dx: e.x - x, dy: e.y - y }
      e.path = []
      e.lift = true
    } else {
      const room = this.roomAt(x, y)
      if (room) this.resolveRoom(room)
    }
  }
  private onMove = (ev: PointerEvent) => {
    if (!this.drag || ev.pointerId !== this.drag.id || !this.cur) return
    const [x, y] = this.logical(ev), e = this.cur
    e.x = Math.max(10, Math.min(182, x + this.drag.dx))
    e.y = Math.max(24, Math.min(252, y + this.drag.dy - 6))
    this.hover = this.roomAt(x, y)
  }
  private onUp = (ev: PointerEvent) => {
    if (!this.drag || ev.pointerId !== this.drag.id || !this.cur) return
    const [x, y] = this.logical(ev)
    this.drag = null
    this.cur.lift = false
    const room = this.roomAt(x, y)
    this.hover = null
    if (room) this.resolveRoom(room, true)
    else this.moveTo(this.cur, [COUNTER], null, 160)
  }

  /* ---------- loop ---------- */
  private frame = (now: number) => {
    const dt = Math.min(0.05, (now - this.last) / 1000)
    this.last = now
    const t = now / 1000
    if (['triage', 'diag', 'send', 'moving', 'arriving'].includes(this.ui.phase)) {
      const time = Math.max(0, this.ui.time - dt)
      this.ui.time = time
      if (now - this.lastEmit > 100) {
        this.lastEmit = now
        this.set({ time })
      }
      if (time <= 0) this.endGame()
    }
    this.update(dt)
    this.render(t)
    this.raf = requestAnimationFrame(this.frame)
  }

  private update(dt: number) {
    for (const e of this.ents) {
      e.moving = false
      if (e.path.length && !(this.drag && e === this.cur)) {
        if (!e.path[0]) {
          e.path.shift()
          continue
        }
        const [tx, ty] = e.path[0], dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy), step = e.speed * dt
        if (Math.abs(dx) > 0.5) e.flip = dx < 0
        if (d <= step) {
          e.x = tx
          e.y = ty
          e.path.shift()
          if (!e.path.length && e.onArrive) {
            const f = e.onArrive
            e.onArrive = null
            f()
          }
        } else {
          e.x += (dx / d) * step
          e.y += (dy / d) * step
          e.moving = true
        }
      }
    }
  }

  private drawEnt(e: Ent, t: number) {
    const ctx = this.ctx
    const bob = e.moving ? ((t * 9 + e.blinkAt) | 0) % 2 : 0
    const blink = (t + e.blinkAt) % 3.2 < 0.12
    const dir = e.flip ? -1 : 1
    const ox = e.x - 7 * dir, px = e.x + 8 * dir
    const lift = e.lift ? 5 : 0
    shadow(ox, e.y, 10)
    shadow(px, e.y, 14)
    const ps = e.flip ? e.pet.f : e.pet.c
    const o = e.owner
    const os = e.flip ? (blink ? o.blinkF : o.openF) : blink ? o.blink : o.open
    ctx.drawImage(os, Math.round(ox - 6), Math.round(e.y - 18 - bob - lift))
    ctx.drawImage(ps, Math.round(px - 8), Math.round(e.y - ps.height - (e.moving ? 1 - bob : 0) - lift))
  }

  private render(t: number) {
    const ctx = this.ctx
    setCtx(ctx)
    drawClinic(t)
    if (this.ui.phase === 'send') {
      const pulse = ((t * 2) | 0) % 2
      for (const k of ROOM_IDS) {
        const r = ROOM[k]
        if (this.hover === k) {
          ctx.globalAlpha = 0.28
          R(r.x, r.y, r.w, r.h, '#ffc94a')
          ctx.globalAlpha = 1
        }
        const c = this.hover === k ? '#ffc94a' : pulse ? 'rgba(255,201,74,.75)' : 'rgba(255,201,74,.35)'
        R(r.x, r.y, r.w, 2, c); R(r.x, r.y + r.h - 2, r.w, 2, c); R(r.x, r.y, 2, r.h, c); R(r.x + r.w - 2, r.y, 2, r.h, c)
      }
    }
    shadow(96, 104, 10)
    ctx.drawImage((t + 0.7) % 3.4 < 0.12 ? VET.blink : VET.open, 90, 86)
    drawDesk()
    const cur = this.cur
    for (const e of [...this.ents].sort((a, b) => a.y - b.y)) if (e !== cur || !e.lift) this.drawEnt(e, t)
    if (cur && this.ui.phase === 'send' && !this.drag) {
      const on = ((t * 3) | 0) % 2, x0 = cur.x - 16, y0 = cur.y - 24, x1 = cur.x + 18, y1 = cur.y + 3, c = '#ffc94a'
      if (on) {
        R(x0, y0, 5, 1, c); R(x0, y0, 1, 5, c); R(x1 - 5, y0, 5, 1, c); R(x1, y0, 1, 5, c)
        R(x0, y1, 5, 1, c); R(x0, y1 - 4, 1, 5, c); R(x1 - 5, y1, 5, 1, c); R(x1, y1 - 4, 1, 5, c)
      }
      const ay = y0 - 8 - (((t * 4) | 0) % 2)
      R(cur.x, ay, 3, 4, '#1a1626'); R(cur.x - 2, ay + 3, 7, 1, '#1a1626'); R(cur.x - 1, ay + 4, 5, 1, '#1a1626'); R(cur.x, ay + 5, 3, 1, '#1a1626')
      R(cur.x + 1, ay + 1, 1, 3, c); R(cur.x, ay + 4, 3, 1, c)
    }
    if (cur?.lift) this.drawEnt(cur, t)
  }
}
