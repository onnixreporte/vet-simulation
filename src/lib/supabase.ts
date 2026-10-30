// Cliente mínimo para la API REST de Supabase (PostgREST). Evita sumar supabase-js
// al bundle: el juego solo lee casos y llama a dos funciones.

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/+$/, '')
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabase = Boolean(URL && KEY)

export class SupabaseError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function sb<T>(path: string, init: RequestInit = {}, timeoutMs = 6000): Promise<T> {
  if (!URL || !KEY) throw new SupabaseError('Supabase no está configurado', 0)
  const ctrl = new AbortController()
  const timer = window.setTimeout(() => ctrl.abort(), timeoutMs)
  const headers: Record<string, string> = { apikey: KEY, 'Content-Type': 'application/json' }
  // Las claves anon viejas son JWT y también van como Bearer; las publishable (sb_publishable_…) no.
  if (KEY.startsWith('eyJ')) headers.Authorization = `Bearer ${KEY}`
  try {
    const res = await fetch(`${URL}/rest/v1/${path}`, { ...init, headers, signal: ctrl.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new SupabaseError(body?.message || `Error ${res.status}`, res.status)
    }
    return (await res.json()) as T
  } finally {
    window.clearTimeout(timer)
  }
}

export const rpc = <T>(fn: string, args: Record<string, unknown>) =>
  sb<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) })
