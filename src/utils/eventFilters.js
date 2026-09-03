export function parseEventFilters(searchParams, config) {
  return Object.fromEntries(
    Object.entries(config).map(([name, settings]) => {
      const rawValue = searchParams.get(settings.param)
      const isAllowed = !settings.values || settings.values.includes(rawValue)
      const value = rawValue != null && isAllowed ? rawValue : settings.defaultValue

      return [name, value]
    }),
  )
}

export function createEventFilterParams(filters, config) {
  const params = new URLSearchParams()

  Object.entries(config).forEach(([name, settings]) => {
    const value = filters[name]
    if (value != null && value !== '' && value !== settings.defaultValue) {
      params.set(settings.param, value)
    }
  })

  return params
}
