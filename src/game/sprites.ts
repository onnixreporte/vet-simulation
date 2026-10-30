// Pixel art propio. 1 carácter = 1 pixel.
// k = contorno, '.' = transparente, el resto se resuelve con la paleta.

export const INK = '#1a1626'

type Pal = Record<string, string | undefined>

const HUMAN = [
  '...kkkkkk...',
  '..khhhhhhk..',
  '.khHHhhhhhk.',
  '.khhhhhhhhk.',
  'khhsssssshhk',
  'khsesssseshk',
  'khsrssssrshk',
  '.ksssmmsssk.',
  '..kksssskk..',
  '.kccxccxcck.',
  'kcccccccccck',
  'sccccccccccs',
  'sCccccccccCs',
  'kCccccccccCk',
  '.kCCCCCCCCk.',
  '..kppkkppk..',
  '..kPPkkPPk..',
  '...kk..kk...',
]
const DOG = [
  '..........kkkk..',
  '.........kbbbbk.',
  '........kdbbbbbk',
  '........kdbbebbk',
  '........kdbbbbbn',
  '.k.......kbbmbk.',
  'kbk.....kkbbbk..',
  '.kbkkkkkbbbbbk..',
  '..kbbbbbbbbbbk..',
  '..kbBBBBBBBBbk..',
  '..kbk..kbk.kbk..',
  '..kk...kk..kk...',
]
const CAT = [
  '..........k..k..',
  '.........kbkkbk.',
  '.........kbbbbk.',
  '.........kebbek.',
  'k........kbbnbk.',
  'kb.......kkbbk..',
  '.kb......kbbbk..',
  '..kbkkkkkbbbbk..',
  '..kbbbbbbbbbbk..',
  '..kbBBBBBBBBbk..',
  '..kbk..kbk.kbk..',
  '..kk...kk..kk...',
]
const UNICORN = [
  '............Y...',
  '...........kYk..',
  '..........kbbbk.',
  '.........mkbbbbk',
  '.........mkbebbk',
  '........mmkbbbbn',
  '........mkbbbkk.',
  '.mm....mmkbbbk..',
  'mmmkkkkkkbbbbk..',
  '.mkbbbbbbbbbbk..',
  '..kbbbbbbbbbbk..',
  '..kbBBBBBBBBbk..',
  '..kbk..kbk.kbk..',
  '..kbk..kbk.kbk..',
  '..kYk..kYk.kYk..',
  '..kk...kk..kk...',
]
const DINO = [
  '........kkkkkk..',
  '.......kggggggk.',
  '.......kgGgegggk',
  '.......kgggggggk',
  '.......kgggwkwkk',
  '.......kggkkkkk.',
  'k.....kgggk.....',
  'gk...kggggkk....',
  '.gk.kgggggkgk...',
  '..gkgggggggk....',
  '...kgBBBBggk....',
  '...kggggggk.....',
  '...kgk..kgk.....',
  '...kgk..kgk.....',
  '..kggk.kggk.....',
  '..kkkk.kkkk.....',
]
const ELEPHANT = [
  '......kkkkkk....',
  '.....kggggggk...',
  '...kkdgggggggk..',
  '..kdddgggggegk..',
  '..kdddggggggggk.',
  '..kddkgggggggkgk',
  '.kgkkggggggggkgk',
  'kggggggggggggkgk',
  'kggggggggggggkgk',
  'kgGGGGGGGGgggk.k',
  'kggggggggggggk..',
  '.kggk..kggk.kggk',
  '.kggk..kggk.kggk',
  '.kkkk..kkkk.kkkk',
]
const ICON_ROWS = {
  coin: ['..kkkk..', '.kyyyyk.', 'kyWyyyOk', 'kyWyyyOk', 'kyyyyyOk', 'kyyyyOOk', '.kyOOOk.', '..kkkk..'],
  paw: ['.k....k.', 'kpk..kpk', '.k.kk.k.', '..kppk..', '.kppppk.', '.kppppk.', '..kkkk..', '........'],
  clock: ['..kkkk..', '.kwwwwk.', 'kwwkwwwk', 'kwwkwwwk', 'kwwkkkwk', 'kwwwwwwk', '.kwwwwk.', '..kkkk..'],
  star: ['...kk...', '...yk...', 'kkkyykkk', 'kyyyyyyk', '.kyyyyk.', '.kyykyk.', 'kyk..kyk', 'kk....kk'],
  arrow: ['...k....', '...kk...', 'kkkkyk..', 'kyyyyyk.', 'kyyyyyk.', 'kkkkyk..', '...kk...', '...k....'],
  sound: ['...w..y.', '..ww...y', 'wwww.y.y', 'wwww.y.y', 'wwww.y.y', 'wwww.y.y', '..ww...y', '...w..y.'],
  mute: ['...w....', '..ww....', 'wwww....', 'wwww.p.p', 'wwww..p.', 'wwww.p.p', '..ww....', '...w....'],
}

export function compile(rows: string[], pal: Pal): HTMLCanvasElement {
  const h = rows.length
  const w = Math.max(...rows.map((r) => r.length))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const x = c.getContext('2d')!
  rows.forEach((r, y) => {
    for (let i = 0; i < r.length; i++) {
      const ch = r[i]
      if (ch === '.') continue
      const col = ch === 'k' ? INK : pal[ch]
      if (!col) continue
      x.fillStyle = col
      x.fillRect(i, y, 1, 1)
    }
  })
  return c
}

function flipped(c: HTMLCanvasElement): HTMLCanvasElement {
  const f = document.createElement('canvas')
  f.width = c.width
  f.height = c.height
  const x = f.getContext('2d')!
  x.translate(c.width, 0)
  x.scale(-1, 1)
  x.drawImage(c, 0, 0)
  return f
}

export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)))
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('')
}

export interface Person {
  open: HTMLCanvasElement
  blink: HTMLCanvasElement
  openF: HTMLCanvasElement
  blinkF: HTMLCanvasElement
}
export interface Animal {
  c: HTMLCanvasElement
  f: HTMLCanvasElement
}

function person(o: { hair: string; skin: string; shirt: string; accent?: string; pants?: string }): Person {
  const pal: Pal = {
    h: o.hair, H: shade(o.hair, 1.35), s: o.skin, e: INK, r: '#f08a8a', m: '#9e3f3f',
    c: o.shirt, C: shade(o.shirt, 0.78), x: o.accent || shade(o.shirt, 0.78), p: o.pants || '#3d4a6b', P: '#2a2333',
  }
  const open = compile(HUMAN, pal)
  const blink = compile(HUMAN, { ...pal, e: o.skin })
  return { open, blink, openF: flipped(open), blinkF: flipped(blink) }
}

function animal(rows: string[], pal: Pal): Animal {
  const c = compile(rows, { ...pal, B: pal.B || (pal.b && shade(pal.b, 0.85)) })
  return { c, f: flipped(c) }
}

export const VET = person({ hair: '#3a241a', skin: '#f0c49b', shirt: '#f4f7fb', accent: '#3fb39a', pants: '#3fb39a' })

export const OWNERS: Person[] = [
  person({ hair: '#e8a83a', skin: '#f6d2ae', shirt: '#e55d5d' }),
  person({ hair: '#2e211c', skin: '#c98c5f', shirt: '#4f7fd1' }),
  person({ hair: '#b5532c', skin: '#f2c7a0', shirt: '#7bbf6a', pants: '#5b3f2a' }),
  person({ hair: '#1d1d2a', skin: '#8a5a3b', shirt: '#f0b43c' }),
  person({ hair: '#dcdce6', skin: '#f0c8a8', shirt: '#9a6ad0' }),
  person({ hair: '#7a3fb0', skin: '#e8b892', shirt: '#ff8fb1', pants: '#2b2b3d' }),
  person({ hair: '#5a3a22', skin: '#d9a274', shirt: '#3fb3c9', pants: '#43405a' }),
]

export const PETS = {
  perroMarron: animal(DOG, { b: '#c4834a', d: '#7a4b2a', e: INK, n: INK, m: '#ff7a8a' }),
  perroNegro: animal(DOG, { b: '#4a4256', d: '#2a2533', e: '#fff', n: '#ff9aa8', m: '#ff7a8a' }),
  perroBlanco: animal(DOG, { b: '#faf6ee', d: '#d8ccb6', e: INK, n: INK, m: '#ff7a8a' }),
  perroSalchi: animal(DOG, { b: '#a5602f', d: '#5e3418', e: INK, n: INK, m: '#ff7a8a' }),
  gatoCrema: animal(CAT, { b: '#f1dcb3', e: '#3a7bd5', n: '#f08a9a' }),
  gatoGris: animal(CAT, { b: '#a0a6b8', e: '#5fd35f', n: '#f08a9a' }),
  gatoNaranja: animal(CAT, { b: '#f39a3e', e: '#2f7a2f', n: '#f08a9a' }),
  unicornio: animal(UNICORN, { b: '#fdfaff', B: '#e2dcf2', m: '#ff8fd0', e: INK, n: '#f3b3c8', Y: '#ffc94a' }),
  dino: animal(DINO, { g: '#5fc463', G: '#a2ea8f', B: '#c9e98b', e: INK, w: '#ffffff' }),
  elefante: animal(ELEPHANT, { g: '#a9abc8', G: '#c7c9e0', d: '#8587a8', e: INK }),
}
export type PetKey = keyof typeof PETS

const icPal: Pal = { y: '#ffc94a', W: '#fff3b8', O: '#d18f1d', p: '#ff9ab0', w: '#fff5df' }
export const ICONS = Object.fromEntries(
  Object.entries(ICON_ROWS).map(([k, rows]) => [k, compile(rows, icPal).toDataURL()]),
) as Record<keyof typeof ICON_ROWS, string>

const urlCache = new Map<HTMLCanvasElement, string>()
export function toUrl(c: HTMLCanvasElement): string {
  let u = urlCache.get(c)
  if (!u) {
    u = c.toDataURL()
    urlCache.set(c, u)
  }
  return u
}
