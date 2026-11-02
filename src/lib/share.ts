import { BUG_ICON } from '../game/bichos'
import { drawFacade, getCtx, setCtx, shadow } from '../game/draw'
import { ICONS, OWNERS, PETS, INK } from '../game/sprites'
import { MODO_NOMBRE, playerName, vetName, type Modo, type Player } from './types'

export type Red = 'whatsapp' | 'instagram' | 'facebook'

export interface Resultado {
  player: Player
  modo: Modo
  pts: number
  /** pacientes atendidos (turno) o bichos eliminados */
  count: number
  /** sólo en el turno */
  stars?: number
  /** sólo en los modos de bichos */
  wave?: number
}

// Formato historia: sirve para Instagram, estados de WhatsApp y Facebook.
const CW = 1080
const CH = 1920
const DISPLAY = '"Press Start 2P", "Courier New", monospace'
const BODY = '"Pixelify Sans", "Trebuchet MS", sans-serif'

const link = () => location.origin + '/'

/** Línea de detalle debajo del puntaje. */
function detalle(r: Resultado) {
  if (r.modo === 'turno') return `${r.count} paciente${r.count === 1 ? '' : 's'} atendido${r.count === 1 ? '' : 's'}`
  return `${r.count} bicho${r.count === 1 ? '' : 's'} eliminado${r.count === 1 ? '' : 's'} · oleada ${r.wave ?? 1}`
}

/** Texto que acompaña a la imagen. */
export function shareText(r: Resultado) {
  const que = r.modo === 'turno' ? `atendiendo ${r.count} paciente${r.count === 1 ? '' : 's'}` : `eliminando ${r.count} bicho${r.count === 1 ? '' : 's'}`
  return `¡Hice ${r.pts} puntos ${que} en ¡Siguiente Paciente! ¿Me superás? ${link()}`
}

function img(src: string) {
  const i = new Image()
  i.src = src
  return i.decode().then(() => i)
}

/** Escribe texto achicando la letra hasta que entre en `max` px de ancho. */
function fit(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, family: string, max: number, weight = 400) {
  let s = size
  c.font = `${weight} ${s}px ${family}`
  while (s > 10 && c.measureText(text).width > max) c.font = `${weight} ${--s}px ${family}`
  c.fillText(text, x, y)
}

/** Borde de pixel grueso como los .pbox del juego. */
function box(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, b = 10) {
  c.fillStyle = INK
  c.fillRect(x - b, y, w + b * 2, h)
  c.fillRect(x, y - b, w, h + b * 2)
  c.fillStyle = fill
  c.fillRect(x, y, w, h)
}

/** Dibuja la imagen para compartir y la devuelve como PNG. */
export async function makeCard(r: Resultado): Promise<Blob> {
  await Promise.all([document.fonts.load(`40px ${DISPLAY}`), document.fonts.load(`40px ${BODY}`), document.fonts.load(`700 40px ${BODY}`)]).catch(() => {})
  const [star, bug] = await Promise.all([img(ICONS.star), img(BUG_ICON)])

  const cv = document.createElement('canvas')
  cv.width = CW
  cv.height = CH
  const c = cv.getContext('2d')!
  c.imageSmoothingEnabled = false
  c.textAlign = 'center'
  c.textBaseline = 'alphabetic'

  // fondo de noche con puntitos, como el body
  c.fillStyle = '#17122a'
  c.fillRect(0, 0, CW, CH)
  c.fillStyle = '#241c40'
  for (let y = 12; y < CH; y += 36) for (let x = 12 + ((y / 36) % 2) * 18; x < CW; x += 36) c.fillRect(x, y, 6, 6)

  // título
  c.fillStyle = '#63dfb0'
  fit(c, r.modo === 'turno' ? 'GUARDIA VETERINARIA' : 'MODO SECRETO · ' + MODO_NOMBRE[r.modo].toUpperCase(), CW / 2, 110, 30, DISPLAY, 940)
  c.font = `76px ${DISPLAY}`
  ;['¡SIGUIENTE', 'PACIENTE!'].forEach((t, i) => {
    const y = 220 + i * 104
    c.fillStyle = INK
    for (const [dx, dy] of [[9, 18], [18, 18], [-9, 0], [0, -9], [-9, 9]]) c.fillText(t, CW / 2 + dx, y + dy)
    c.fillStyle = '#ff6b6b'
    for (const [dx, dy] of [[0, 9], [9, 9]]) c.fillText(t, CW / 2 + dx, y + dy)
    c.fillStyle = '#ffc94a'
    c.fillText(t, CW / 2, y)
  })

  // fachada de su veterinaria, con el jugador y su mascota en la puerta
  const S = 5
  // se recorta arriba un poco de cielo y abajo media calle
  const TOP = 38
  const BOT = 196
  const FH = (BOT - TOP) * S
  const fx = (CW - 192 * S) / 2
  const fy = 370
  const fc = document.createElement('canvas')
  fc.width = 192
  fc.height = 200
  const prev = getCtx()
  setCtx(fc.getContext('2d')!)
  drawFacade(0, false)
  const who = OWNERS[r.player.o] ?? OWNERS[2]
  const pet = (PETS[r.player.pet] ?? PETS.perroMarron).c
  shadow(90, 180, 10)
  shadow(106, 180, 12)
  const fctx = fc.getContext('2d')!
  fctx.drawImage(who.open, 84, 162)
  fctx.drawImage(pet, 97, 180 - pet.height)
  if (r.modo !== 'turno') for (const [x, y] of [[40, 150], [150, 146], [70, 172], [128, 176], [18, 176]]) fctx.drawImage(bug, x, y)
  if (prev) setCtx(prev)
  box(c, fx, fy, 192 * S, FH, '#000')
  c.drawImage(fc, 0, TOP, 192, BOT - TOP, fx, fy, 192 * S, FH)

  // nombre de la vete en el cartel (en el juego va en el DOM, acá se pinta)
  const sign = vetName(r.player).toUpperCase()
  // entre el ícono de la izquierda y la cruz
  const sx = fx + 68 * S
  const sw = 56 * S
  const sy = fy + (67 - TOP) * S
  const sh = 15 * S
  let size = 34
  c.font = `${size}px ${DISPLAY}`
  while (size > 10 && c.measureText(sign).width > sw) c.font = `${--size}px ${DISPLAY}`
  const ty = sy + sh / 2 + size / 2
  c.fillStyle = '#11433b'
  c.fillText(sign, sx + sw / 2 + 4, ty + 4)
  c.fillStyle = '#fff8e6'
  c.fillText(sign, sx + sw / 2, ty)

  // tarjeta del resultado
  const cy = fy + FH + 50
  const chh = r.modo === 'turno' ? 390 : 320
  box(c, 70, cy, CW - 140, chh, '#fff5df')
  c.fillStyle = '#f4e3bd'
  c.fillRect(70, cy + chh - 10, CW - 140, 10)
  c.fillStyle = '#a8461f'
  fit(c, playerName(r.player), CW / 2, cy + 74, 52, BODY, CW - 220, 700)
  let y = cy + 100
  if (r.modo === 'turno') {
    const ss = 72
    for (let i = 0; i < 3; i++) {
      c.globalAlpha = i < (r.stars ?? 0) ? 1 : 0.25
      c.drawImage(star, CW / 2 - ss * 1.5 - 20 + i * (ss + 20), y, ss, ss)
    }
    c.globalAlpha = 1
    y += ss + 20
  }
  c.fillStyle = INK
  fit(c, `${r.pts} PTS`, CW / 2, y + 110, 96, DISPLAY, CW - 220)
  c.fillStyle = '#6c5b66'
  fit(c, detalle(r), CW / 2, y + 180, 44, BODY, CW - 220)

  // invitación
  const fy2 = cy + chh + 110
  c.fillStyle = '#ffc94a'
  // la fuente pixel no tiene Á: va con la otra
  fit(c, '¿Me superás?', CW / 2, fy2, 72, BODY, 940, 700)
  c.fillStyle = '#fff5df'
  fit(c, location.host, CW / 2, fy2 + 74, 44, BODY, 940)
  c.fillStyle = '#b7acd6'
  fit(c, 'un juego de Petsys', CW / 2, fy2 + 126, 34, BODY, 940)

  return new Promise((ok, fail) => cv.toBlob((b) => (b ? ok(b) : fail(new Error('No se pudo generar la imagen'))), 'image/png'))
}

function download(blob: Blob, name: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}

/** En el celular el menú del sistema deja elegir la app con la imagen; en la compu no siempre. */
const mobile = () => matchMedia('(pointer: coarse)').matches

/**
 * Comparte la imagen. Devuelve un aviso para mostrar, o null si no hace falta.
 * Se llama directo desde el click (sin esperas antes) para que el navegador permita abrir ventanas y compartir.
 */
export async function shareTo(red: Red, blob: Blob, r: Resultado): Promise<string | null> {
  const text = shareText(r)
  const name = `siguiente-paciente-${r.pts}.png`
  const file = new File([blob], name, { type: 'image/png' })

  if (mobile() && navigator.canShare?.({ files: [file] })) {
    try {
      // Instagram ignora el texto: va sólo la imagen
      await navigator.share(red === 'instagram' ? { files: [file] } : { files: [file], text })
      return null
    } catch (e) {
      if ((e as Error).name === 'AbortError') return null
      // si falla, sigue con la descarga
    }
  }

  if (red === 'whatsapp') window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener')
  if (red === 'facebook') window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(link()), '_blank', 'noopener')
  download(blob, name)
  if (red === 'instagram') return 'Guardamos la imagen: subila a tu historia de Instagram.'
  return 'Guardamos la imagen para que la adjuntes en tu publicación.'
}
