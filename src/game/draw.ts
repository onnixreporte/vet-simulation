import { INK, OWNERS, PETS, shade, type PetKey } from './sprites'
import type { RoomId } from './cases'

// Escena de 192x256 px lógicos (vertical para celular) y fachada de 192x200.
export const W = 192
export const H = 256

let ctx: CanvasRenderingContext2D
export const setCtx = (c: CanvasRenderingContext2D) => {
  ctx = c
}
export const getCtx = () => ctx

export const R = (x: number, y: number, w: number, h: number, c: string) => {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h))
}
export function circle(cx: number, cy: number, r: number, c: string) {
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(r * r - y * y))
    R(cx - w, cy + y, w * 2 + 1, 1, c)
  }
}
export function shadow(x: number, y: number, w: number) {
  R(x - w / 2, y - 1, w, 2, 'rgba(26,22,38,.22)')
  R(x - w / 2 + 1, y - 2, w - 2, 1, 'rgba(26,22,38,.12)')
}
function tiles(x: number, y: number, w: number, h: number, a: string, b: string, g: string, s: number) {
  for (let j = 0; j * s < h; j++)
    for (let i = 0; i * s < w; i++) R(x + i * s, y + j * s, Math.min(s, w - i * s), Math.min(s, h - j * s), (i + j) % 2 ? a : b)
  for (let i = s; i < w; i += s) R(x + i, y, 1, h, g)
  for (let j = s; j < h; j += s) R(x, y + j, w, 1, g)
}
function wood(x: number, y: number, w: number, h: number) {
  const cs = ['#cf9459', '#c48a52', '#ba7f49']
  for (let j = 0, r = 0; j < h; j += 6, r++) {
    R(x, y + j, w, Math.min(6, h - j), cs[r % 3])
    R(x, y + j + 5, w, 1, '#9c6537')
    R(x, y + j, w, 1, 'rgba(255,255,255,.12)')
    for (let i = (r * 17) % 29; i < w; i += 29) R(x + i, y + j, 1, 5, '#9c6537')
  }
}
function face(x: number, y: number, w: number, h: number, c: string, base: string) {
  R(x, y, w, h, c)
  R(x, y + h, w, 1, base)
  R(x, y + h + 1, w, 2, 'rgba(26,22,38,.14)')
}

export interface Rect { x: number; y: number; w: number; h: number }
export const ROOM: Record<RoomId | 'rec', Rect> = {
  banos: { x: 4, y: 4, w: 90, h: 72 },
  perros: { x: 98, y: 4, w: 90, h: 72 },
  rec: { x: 4, y: 80, w: 184, h: 90 },
  quirofano: { x: 4, y: 174, w: 90, h: 78 },
  espera: { x: 98, y: 174, w: 90, h: 78 },
}
export const FACE = 11

export function drawPlant(x: number, y: number, t: number) {
  shadow(x, y + 1, 10)
  R(x - 4, y - 6, 8, 7, INK); R(x - 3, y - 5, 6, 5, '#c06b3a'); R(x - 3, y - 5, 6, 1, '#de8a55')
  const sw = Math.round(Math.sin(t * 1.5 + x) * 0.6)
  circle(x + sw, y - 11, 5, INK); circle(x + sw, y - 11, 4, '#4fa860')
  R(x - 2 + sw, y - 14, 2, 2, '#7bd28a'); R(x + 2 + sw, y - 10, 2, 2, '#3a8a4a')
}

export function drawDesk() {
  shadow(96, 116, 60)
  R(66, 102, 60, 14, INK)
  R(67, 103, 58, 5, '#d9965a'); R(67, 103, 58, 1, '#f0b47c')
  R(67, 108, 58, 7, '#a8693a'); for (let i = 71; i < 124; i += 9) R(i, 109, 6, 5, '#b9773f')
  R(72, 95, 14, 10, INK); R(73, 96, 12, 7, '#3fb3c9'); R(74, 97, 4, 1, '#bff0ff'); R(78, 104, 2, 2, INK)
  R(112, 101, 6, 3, INK); R(113, 100, 4, 2, '#ffc94a'); R(114, 99, 2, 1, INK)
  R(98, 101, 9, 3, '#fff5df'); R(99, 100, 9, 2, '#ffffff'); R(100, 101, 5, 1, '#c9b9a0')
}

export function drawClinic(t: number) {
  R(0, 0, W, H, '#3b3352')
  for (let i = 0; i < W; i += 8) R(i, 0, 1, H, 'rgba(255,255,255,.03)')
  const B = ROOM.banos, P = ROOM.perros, C = ROOM.rec, Q = ROOM.quirofano, E = ROOM.espera
  tiles(B.x, B.y, B.w, B.h, '#d4edf8', '#c2e4f4', '#a4d0e6', 8)
  wood(P.x, P.y, P.w, P.h)
  tiles(C.x, C.y, C.w, C.h, '#f5e8cb', '#ecd9b2', '#ecd9b2', 10)
  tiles(Q.x, Q.y, Q.w, Q.h, '#d2f2e3', '#bfe8d5', '#a6dbc2', 8)
  tiles(E.x, E.y, E.w, E.h, '#f4d2c2', '#ecc2ae', '#d9a790', 8)
  // aperturas de puertas
  for (const dx of [40, 136]) {
    tiles(dx, 76, 16, 4, '#ecd9b2', '#ecd9b2', '#ecd9b2', 16)
    R(dx - 1, 74, 1, 7, INK); R(dx + 16, 74, 1, 7, INK)
    tiles(dx, 170, 16, 4, '#ecd9b2', '#ecd9b2', '#ecd9b2', 16)
    R(dx - 1, 169, 1, 7, INK); R(dx + 16, 169, 1, 7, INK)
  }
  // caras de pared (perspectiva 3/4)
  face(B.x, B.y, B.w, FACE, '#86c8e8', '#4f93b5')
  for (let i = B.x; i < B.x + B.w; i += 5) R(i, B.y, 1, FACE, '#76b9da')
  for (let j = 3; j < FACE; j += 4) R(B.x, B.y + j, B.w, 1, '#76b9da')
  face(P.x, P.y, P.w, FACE, '#f2c477', '#b8843c')
  for (let i = 0; i < P.w; i += 10) { R(P.x + i + 3, P.y + 3, 2, 2, '#e0a752'); R(P.x + i + 8, P.y + 7, 2, 2, '#e0a752') }
  face(C.x, C.y, C.w, FACE, '#fbe3a6', '#b67b45')
  R(C.x, C.y + 6, C.w, 5, '#c88a52'); R(C.x, C.y + 6, C.w, 1, '#e0a46b')
  face(Q.x, Q.y, Q.w, FACE, '#94dcc0', '#4b9c7f')
  face(E.x, E.y, E.w, FACE, '#ee9a82', '#b5604c')
  for (let i = 0; i < E.w; i += 6) R(E.x + i, E.y, 3, FACE, '#e58e76')
  for (const dx of [40, 136]) { R(dx, C.y, 16, FACE + 3, '#ecd9b2'); R(dx, Q.y, 16, FACE + 3, '#d2f2e3') }
  R(136, E.y, 16, FACE + 3, '#f4d2c2'); R(40, Q.y, 16, FACE + 3, '#d2f2e3')

  /* BAÑOS */
  ;([['#ff8fb1', 54], ['#ffc94a', 62], ['#8fd3ff', 70]] as const).forEach(([c, x]) => { R(x, 6, 6, 8, INK); R(x + 1, 7, 4, 6, c); R(x + 1, 11, 4, 1, shade(c, 0.8)) })
  R(10, 5, 14, 8, INK); R(11, 6, 12, 6, '#d8f4ff'); R(13, 7, 2, 4, '#fff')
  const tx = 8, ty = 20
  shadow(tx + 16, ty + 22, 30)
  R(tx, ty, 32, 20, INK); R(tx + 1, ty + 1, 30, 18, '#fdfdff'); R(tx + 1, ty + 16, 30, 3, '#d4dbea')
  R(tx + 4, ty + 4, 24, 11, '#69b8e6'); R(tx + 4, ty + 4, 24, 2, '#9bd3f2')
  R(tx + 26, ty + 2, 3, 2, '#b6bccb')
  for (let i = 0; i < 6; i++) {
    const bx = tx + 6 + ((i * 7 + t * 6) % 20), by = ty + 6 + ((i * 3) % 7) - ((t * 4 + i) % 3)
    R(bx, by, 2, 2, '#fff'); R(bx + 1, by, 1, 1, '#cfefff')
  }
  const bub = (t * 10) % 22; R(tx + 14, ty - bub * 0.6, 2, 2, 'rgba(255,255,255,.85)')
  shadow(66, 42, 24)
  R(54, 26, 26, 14, INK); R(55, 27, 24, 9, '#c9ccdc'); R(55, 27, 24, 2, '#e8eaf3'); R(55, 36, 24, 3, '#9a9eb3')
  R(80, 18, 2, 18, INK); R(76, 16, 8, 4, INK); R(77, 17, 6, 2, '#ff6b6b')
  ;([['#63dfb0', 44], ['#ff8fb1', 48]] as const).forEach(([c, x]) => { shadow(x + 1, 44, 4); R(x, 36, 4, 8, INK); R(x + 1, 37, 2, 6, c); R(x + 1, 35, 2, 1, INK) })
  R(12, 52, 22, 12, INK); R(13, 53, 20, 10, '#ff9ab0'); for (let i = 15; i < 32; i += 3) R(i, 53, 1, 10, '#f07d97')
  R(66, 58, 8, 8, INK); R(67, 59, 6, 6, '#9aa3b5'); R(68, 61, 4, 1, INK); R(68, 63, 4, 1, INK)
  R(44, 62, 10, 3, '#9bd3f2'); R(46, 61, 6, 1, '#9bd3f2')

  /* SALA DE PERROS */
  for (let k = 0; k < 3; k++) {
    const kx = P.x + 4 + k * 29, ky = P.y + 4
    R(kx, ky, 25, 24, INK); R(kx + 1, ky + 1, 23, 22, '#3a3150'); R(kx + 1, ky + 1, 23, 3, '#8c6bb0')
    R(kx + 2, ky + 14, 21, 8, '#8fd3ff'); R(kx + 2, ky + 14, 21, 1, '#c7e8ff')
    if (k === 1) {
      ctx.drawImage(PETS.perroBlanco.c, kx + 4, ky + 9)
      const z = (t * 2) | 0
      R(kx + 15, ky + 8 - (z % 2), 3, 1, '#fff'); R(kx + 17, ky + 6 - (z % 2), 3, 1, '#fff')
    }
    for (let b = 3; b < 24; b += 4) R(kx + b, ky + 4, 1, 19, '#c9c3dc')
    R(kx + 1, ky + 23, 23, 2, 'rgba(26,22,38,.25)')
  }
  const bx2 = 160, by2 = 56
  shadow(bx2, by2 + 9, 24); circle(bx2, by2, 10, INK); circle(bx2, by2, 9, '#e38f5a'); circle(bx2, by2, 6, '#ffd2a8'); R(bx2 - 3, by2 - 1, 2, 1, '#f2b58a')
  R(108, 58, 10, 5, INK); R(109, 58, 8, 3, '#6fb6ef'); R(109, 58, 8, 1, '#bfe3ff')
  R(120, 58, 10, 5, INK); R(121, 58, 8, 3, '#ff6b6b'); R(122, 58, 6, 1, '#b5733b')
  R(132, 66, 10, 2, '#fff5df'); R(131, 65, 2, 2, '#fff5df'); R(131, 68, 2, 2, '#fff5df'); R(141, 65, 2, 2, '#fff5df'); R(141, 68, 2, 2, '#fff5df')
  circle(178, 42, 3, INK); circle(178, 42, 2, '#ffe14a'); R(177, 41, 1, 1, '#fff')

  /* RECEPCIÓN */
  R(14, 82, 40, 2, '#8a5a35')
  ;['#ff6b6b', '#63dfb0', '#ffc94a', '#8fd3ff', '#ff9ab0', '#b49cf0'].forEach((c, i) => { R(16 + i * 6, 77 + (i % 2), 4, 5 - (i % 2), INK); R(17 + i * 6, 78 + (i % 2), 2, 3 - (i % 2), c) })
  circle(170, 85, 4, INK); circle(170, 85, 3, '#fff5df'); R(170, 83, 1, 3, INK); R(170, 85, 2, 1, INK)
  R(124, 82, 14, 9, INK); R(125, 83, 12, 7, '#63dfb0'); R(129, 85, 4, 3, '#fff5df'); R(128, 84, 1, 1, '#fff5df'); R(133, 84, 1, 1, '#fff5df')
  R(72, 124, 48, 20, INK); R(73, 125, 46, 18, '#c94848'); R(75, 127, 42, 14, '#e06060')
  for (let i = 77; i < 116; i += 4) R(i, 129, 2, 10, '#d05252')
  ;([[12, 108], [180, 108], [12, 162], [180, 162]] as const).forEach(([x, y]) => drawPlant(x, y, t))
  R(8, 128, 10, 24, INK); R(9, 129, 8, 22, '#6e8fd0'); R(9, 129, 8, 2, '#9ab3e6')
  R(174, 120, 10, 16, INK); R(175, 121, 8, 6, '#8fd3ff'); R(175, 127, 8, 8, '#e9eef5'); R(177, 129, 3, 2, '#3b8fd0')

  /* QUIRÓFANO */
  R(Q.x + 40, Q.y + 2, 12, 8, INK); R(Q.x + 41, Q.y + 3, 10, 6, '#fff'); R(Q.x + 45, Q.y + 4, 2, 4, '#ff6b6b'); R(Q.x + 43, Q.y + 5, 6, 2, '#ff6b6b')
  R(8, 186, 16, 24, INK); R(9, 187, 14, 22, '#cde6f2'); R(9, 197, 14, 1, INK)
  ;['#ff6b6b', '#63dfb0', '#ffc94a'].forEach((c, i) => { R(11 + i * 4, 191, 2, 5, c); R(11 + i * 4, 201, 2, 5, shade(c, 0.85)) })
  ctx.globalAlpha = 0.22; circle(46, 222, 20, '#fff6b0'); ctx.globalAlpha = 0.18; circle(46, 222, 13, '#fffbe0'); ctx.globalAlpha = 1
  shadow(46, 234, 34)
  R(30, 214, 32, 18, INK); R(31, 215, 30, 12, '#b8c4d6'); R(31, 215, 30, 2, '#e1e8f2'); R(33, 217, 26, 8, '#4fb89a'); R(33, 217, 26, 1, '#7fd6b8')
  R(31, 227, 30, 4, '#8a95ab'); R(34, 231, 2, 3, INK); R(56, 231, 2, 3, INK)
  R(68, 190, 20, 15, INK); R(69, 191, 18, 11, '#0f2a22')
  const ph = (t * 18) % 18
  for (let i = 0; i < 18; i++) {
    const xx = Math.floor((i + ph) % 18)
    let yy = 197
    if (xx === 6) yy = 193
    else if (xx === 7) yy = 200
    else if (xx === 8) yy = 195
    R(69 + i, yy, 1, 1, i === 17 ? '#d6ffe9' : '#4fe29a')
  }
  R(76, 205, 4, 4, INK)
  R(72, 214, 1, 22, INK); R(68, 212, 9, 1, INK); R(69, 214, 4, 6, '#d8f4ff'); R(69, 214, 4, 1, INK); R(70, 217, 2, 2, '#8fd3ff')
  R(10, 230, 14, 8, INK); R(11, 231, 12, 6, '#e6ebf3'); R(13, 233, 6, 1, '#9aa3b5'); R(13, 235, 4, 1, '#9aa3b5')

  /* SALA DE ESPERA */
  R(160, 176, 12, 8, INK); R(161, 177, 10, 6, '#8fd3ff'); R(161, 181, 10, 2, '#63c06f'); circle(168, 179, 1, '#ffc94a')
  R(104, 176, 10, 8, INK); R(105, 177, 8, 6, '#fff5df'); R(107, 179, 4, 3, '#ff9ab0')
  R(116, 194, 60, 6, INK); R(117, 195, 58, 4, '#6e8fd0'); R(117, 195, 58, 1, '#9ab3e6')
  R(116, 200, 60, 6, INK); R(117, 201, 58, 4, '#5878bd'); R(117, 201, 58, 1, '#7f9ad6')
  R(118, 206, 2, 3, INK); R(172, 206, 2, 3, INK)
  R(104, 226, 18, 11, INK); R(105, 227, 16, 7, '#c98f5a'); R(105, 227, 16, 1, '#e2ad78')
  R(107, 228, 6, 4, '#ff6b6b'); R(113, 229, 6, 4, '#8fd3ff')
  drawPlant(180, 214, t)
  R(186, 222, 6, 22, '#ffe8a8'); R(185, 222, 1, 22, INK); R(186, 222, 6, 1, INK); R(186, 243, 6, 1, INK)
  ctx.globalAlpha = 0.25; R(160, 224, 26, 18, '#fff3c0'); ctx.globalAlpha = 1
  R(176, 226, 9, 15, INK); R(177, 227, 7, 13, '#9c6a3f')

  R(0, 0, W, 1, INK); R(0, H - 1, W, 1, INK); R(0, 0, 1, H, INK); R(W - 1, 0, 1, H, INK)
}

const walkers: { o: number; p: PetKey; off: number }[] = [
  { o: 0, p: 'perroMarron', off: 0 }, { o: 4, p: 'unicornio', off: 70 }, { o: 1, p: 'gatoNaranja', off: 140 },
  { o: 3, p: 'dino', off: 210 }, { o: 5, p: 'gatoGris', off: 280 },
]

export function drawFacade(t: number) {
  const sky = ['#5aaee6', '#7cc2ee', '#a3d6f3', '#cfe9f5', '#ffe6b8']
  sky.forEach((c, i) => {
    R(0, i * 20, W, 20, c)
    if (i) for (let x = 0; x < W; x += 2) { R(x + (i % 2), i * 20 - 1, 1, 1, sky[i - 1]); R(x, i * 20 + 1, 1, 1, c) }
  })
  circle(160, 26, 11, '#fff3c0'); circle(160, 26, 8, '#ffd75a'); R(156, 22, 3, 2, '#fff8d8')
  for (let k = 0; k < 3; k++) {
    const cx = ((t * (5 + k * 2) + k * 90) % 260) - 40, cy = 14 + k * 16
    R(cx, cy, 26, 5, '#fff'); R(cx + 4, cy - 3, 12, 4, '#fff'); R(cx + 14, cy - 5, 8, 6, '#fff'); R(cx, cy + 4, 26, 1, '#dff0fa')
  }
  ;([[0, 72, 18], [16, 64, 14], [30, 76, 20], [150, 66, 16], [166, 74, 26], [182, 60, 12]] as const).forEach(([x, y, w]) => {
    R(x, y, w, 100 - y, '#8db8d6')
    for (let yy = y + 4; yy < 96; yy += 6) for (let xx = x + 3; xx < x + w - 2; xx += 5) R(xx, yy, 2, 2, '#b4d4ea')
  })
  R(12, 120, 5, 46, '#7a4b2a'); R(12, 120, 1, 46, '#5c3820')
  circle(14, 112, 14, INK); circle(14, 112, 13, '#4fa860'); circle(8, 106, 6, '#6cc47b'); circle(20, 118, 5, '#3a8a4a')
  R(24, 58, 144, 110, INK)
  R(25, 59, 142, 108, '#f6e6c8')
  for (let y = 62; y < 166; y += 6) {
    R(25, y, 142, 1, '#ead6b0')
    for (let x = 25 + ((y / 6) % 2) * 6; x < 166; x += 12) R(x, y, 1, 6, '#ead6b0')
  }
  R(20, 52, 152, 8, INK); R(21, 53, 150, 6, '#e0614f'); R(21, 53, 150, 2, '#f2887a')
  // cartel (el nombre va encima, en el DOM)
  R(56, 64, 80, 20, INK); R(57, 65, 78, 18, '#2e9c8a'); R(57, 65, 78, 2, '#4fc4ae'); R(57, 81, 78, 2, '#1f7466')
  R(60, 69, 2, 2, '#fff5df'); R(64, 69, 2, 2, '#fff5df'); R(60, 72, 6, 5, '#fff5df')
  R(126, 69, 6, 2, '#ff6b6b'); R(128, 67, 2, 6, '#ff6b6b')
  for (let x = 30; x < 162; x += 8) {
    const c = (x / 8) % 2 ? '#ff6b6b' : '#fff5df'
    R(x, 88, 8, 8, INK); R(x + 1, 88, 6, 7, c); R(x + 2, 95, 4, 2, c); R(x + 1, 95, 1, 1, INK); R(x + 6, 95, 1, 1, INK)
  }
  ;([[34, 'gatoNaranja'], [124, 'perroBlanco']] as const).forEach(([x, pet]) => {
    R(x, 102, 34, 30, INK); R(x + 2, 104, 30, 26, '#a6dcf2'); R(x + 2, 116, 30, 1, INK); R(x + 16, 104, 2, 26, INK)
    const s = PETS[pet].c
    ctx.drawImage(s, x + 4, 129 - s.height)
    R(x + 5, 106, 2, 8, 'rgba(255,255,255,.7)'); R(x + 8, 106, 1, 5, 'rgba(255,255,255,.7)'); R(x + 21, 118, 2, 8, 'rgba(255,255,255,.6)')
    R(x - 2, 132, 38, 6, INK); R(x - 1, 133, 36, 4, '#c06b3a')
    for (let i = 0; i < 6; i++) { R(x + 1 + i * 6, 129, 3, 3, ['#ff8fb1', '#ffc94a', '#ff6b6b'][i % 3]); R(x + 2 + i * 6, 131, 1, 2, '#3a8a4a') }
  })
  R(78, 100, 36, 68, INK); R(80, 102, 32, 66, '#2e9c8a'); R(82, 104, 13, 62, '#bfe8f6'); R(97, 104, 13, 62, '#bfe8f6')
  R(84, 106, 2, 18, 'rgba(255,255,255,.75)'); R(99, 106, 2, 18, 'rgba(255,255,255,.75)')
  R(92, 132, 2, 8, INK); R(98, 132, 2, 8, INK)
  R(86, 114, 20, 8, INK); R(87, 115, 18, 6, '#ff6b6b'); for (let i = 89; i < 104; i += 3) R(i, 117, 2, 2, '#fff5df')
  R(176, 104, 2, 64, INK); R(172, 98, 10, 8, INK); R(173, 99, 8, 6, '#fff3a8')
  R(0, 166, W, 18, '#d9d2c5'); for (let x = 0; x < W; x += 16) R(x, 166, 1, 18, '#bfb6a6'); R(0, 175, W, 1, '#bfb6a6')
  R(0, 184, W, 4, '#a9a196'); R(0, 188, W, 12, '#5a5566')
  for (let x = -((t * 30) % 24); x < W; x += 24) R(x, 193, 12, 2, '#f2e6a0')
  walkers.forEach((w, i) => {
    const x = ((t * 16 + w.off) % 340) - 40, y = 180, bob = ((t * 8 + i) | 0) % 2
    const o = OWNERS[w.o], pet = PETS[w.p]
    shadow(x, y, 10); shadow(x + 15, y, 12)
    ctx.drawImage((t * 0.7 + i) % 3 < 0.1 ? o.blink : o.open, Math.round(x - 6), y - 18 - bob)
    ctx.drawImage(pet.c, Math.round(x + 7), y - pet.c.height - (1 - bob))
  })
}
