export function getPosterDisplayState({ hasError, isLoaded, src }) {
  if (!src || hasError) return 'unavailable'
  return isLoaded ? 'ready' : 'loading'
}
