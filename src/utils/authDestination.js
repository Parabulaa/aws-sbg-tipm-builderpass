// Only resume known in-app destinations. Never trust an arbitrary redirect URL.
export function getAuthDestination(location) {
  const queryPath = new URLSearchParams(location.search || '').get('next')
  const from = location.state?.from
  const candidate = queryPath || (from?.pathname ? `${from.pathname}${from.search || ''}` : '')
  if (!candidate || /[\\\r\n]/.test(candidate)) return ''
  return /^\/(?:events(?:\/[0-9a-f-]{36})?|dashboard|profile)(?:\?[^#]*)?$/i.test(candidate) ? candidate : ''
}

export function authLink(path, destination) {
  return destination ? `${path}?next=${encodeURIComponent(destination)}` : path
}
