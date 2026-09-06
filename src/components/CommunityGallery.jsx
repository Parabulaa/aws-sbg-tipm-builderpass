import { ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { communityImages } from '../content/communityImages.js'

function CommunityPhoto({ photo }) {
  const [failed, setFailed] = useState(false)
  return (
    <figure className="min-w-0 border border-[var(--bp-border)] bg-[var(--bp-surface)] p-3">
      {failed ? (
        <div className="grid aspect-[4/3] place-items-center text-sm text-[var(--bp-text-dim)]">Photo temporarily unavailable</div>
      ) : (
        <img className="aspect-[4/3] w-full object-cover" src={photo.src} alt={photo.alt} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      )}
      {photo.caption && <figcaption className="px-2 py-4 text-sm leading-6 text-[var(--bp-text-dim)]">{photo.caption}</figcaption>}
    </figure>
  )
}

export default function CommunityGallery() {
  if (!communityImages.length) {
    return (
      <div className="mt-8 grid min-h-64 place-items-center border border-dashed border-[var(--bp-amber-muted)] bg-[var(--bp-surface)] p-8 text-center">
        <div>
          <ImageIcon aria-hidden="true" className="mx-auto text-[var(--bp-amber)]" size={32} />
          <p className="mt-5 text-xl font-bold">Community photos coming soon.</p>
          <p className="mt-3 max-w-md text-sm leading-7 text-[var(--bp-text-dim)]">Moments from AWS SBG TIP Manila events and activities will appear here.</p>
        </div>
      </div>
    )
  }
  return <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{communityImages.map((photo) => <CommunityPhoto key={photo.id} photo={photo} />)}</div>
}
