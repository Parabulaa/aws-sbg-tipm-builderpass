import { supabase } from '../services/supabase/client.js'

export const EVENT_POSTER_BUCKET = 'event-posters'
export const EVENT_POSTER_MAX_BYTES = 5 * 1024 * 1024

const extensionByMimeType = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function getEventPosterValidationMessage(file) {
  if (!file) return ''

  if (!extensionByMimeType[file.type]) {
    return 'Choose a JPEG, PNG, or WebP image for the event poster.'
  }

  if (file.size > EVENT_POSTER_MAX_BYTES) {
    return 'Event posters must be 5 MB or smaller.'
  }

  return ''
}

export async function uploadEventPoster(eventId, file) {
  const validationMessage = getEventPosterValidationMessage(file)
  if (validationMessage) throw new Error(validationMessage)

  const extension = extensionByMimeType[file.type]
  const posterPath = `events/${eventId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(EVENT_POSTER_BUCKET)
    .upload(posterPath, file, { contentType: file.type, upsert: false })

  if (error) throw error

  return posterPath
}

export async function removeEventPoster(posterPath) {
  if (!posterPath) return

  const { error } = await supabase.storage.from(EVENT_POSTER_BUCKET).remove([posterPath])
  if (error) throw error
}

export async function getEventPosterUrl(posterPath) {
  if (!posterPath) return null

  const { data, error } = await supabase.storage
    .from(EVENT_POSTER_BUCKET)
    .createSignedUrl(posterPath, 60 * 60)

  if (error) throw error

  return data?.signedUrl ?? null
}

export async function getEventPosterUrls(posterPaths) {
  const uniquePosterPaths = [...new Set(posterPaths.filter(Boolean))]
  if (uniquePosterPaths.length === 0) return {}

  const { data, error } = await supabase.storage
    .from(EVENT_POSTER_BUCKET)
    .createSignedUrls(uniquePosterPaths, 60 * 60)

  if (error) throw error

  return Object.fromEntries(
    (data ?? [])
      .filter(({ path, signedUrl }) => path && signedUrl)
      .map(({ path, signedUrl }) => [path, signedUrl]),
  )
}
