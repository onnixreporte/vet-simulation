import { useEffect, useState, type ReactNode } from 'react'
import { makeCard, shareTo, type Red, type Resultado } from '../lib/share'

const LOGOS: Record<Red, { label: string; svg: ReactNode }> = {
  whatsapp: {
    label: 'WhatsApp',
    svg: (
      <>
        <path d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6z" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinejoin="round" />
        <path
          transform="translate(12 12) scale(.62) translate(-12.4 -12.6)"
          fill="#fff"
          d="M8.6 7.2c-.2-.5-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.4c.2.2 2.4 3.7 5.8 5.1 2.9 1.1 3.4.9 4.1.8.6-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6-.1-.1-.3-.2-.6-.4l-2.1-1c-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.2-.2.2-.3.3-.5.1-.2.1-.4 0-.5z"
        />
      </>
    ),
  },
  instagram: {
    label: 'Instagram',
    svg: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5.5" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="17.3" cy="6.7" r="1.3" fill="#fff" />
      </>
    ),
  },
  facebook: {
    label: 'Facebook',
    svg: <path fill="#fff" d="M13.4 22v-8h2.7l.4-3.1h-3.1V8.9c0-.9.3-1.5 1.6-1.5h1.6V4.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H7.5V14h2.7v8z" />,
  },
}

/** Botones para compartir el resultado como imagen en redes. */
export function ShareButtons(r: Resultado) {
  const [blob, setBlob] = useState<Blob | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const { player, modo, pts, count, stars, wave } = r

  // la imagen se arma apenas aparece el cartel: al tocar, compartir tiene que ser inmediato
  useEffect(() => {
    let alive = true
    makeCard({ player, modo, pts, count, stars, wave })
      .then((b) => alive && setBlob(b))
      .catch(() => alive && setNote('No se pudo armar la imagen.'))
    return () => {
      alive = false
    }
  }, [player, modo, pts, count, stars, wave])

  const share = async (red: Red) => {
    const b = blob ?? (await makeCard(r))
    setNote(await shareTo(red, b, r))
  }

  return (
    <div className="share">
      <span className="share-label">COMPARTILO EN TUS REDES</span>
      <div className="share-row">
        {(Object.keys(LOGOS) as Red[]).map((red) => (
          <button key={red} type="button" className={'soc ' + red} aria-label={'Compartir en ' + LOGOS[red].label} title={LOGOS[red].label} onClick={() => share(red)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{LOGOS[red].svg}</svg>
          </button>
        ))}
      </div>
      {note && <p className="share-note">{note}</p>}
    </div>
  )
}
