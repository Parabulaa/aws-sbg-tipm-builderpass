import { useEffect, useState } from 'react'

export function getRemainingCooldown(deadline, now = Date.now()) {
  if (!Number.isFinite(Number(deadline))) return 0
  return Math.max(0, Math.ceil((Number(deadline) - now) / 1000))
}

export default function useResendCooldown(storageKey) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    () => getRemainingCooldown(sessionStorage.getItem(storageKey)),
  )

  useEffect(() => {
    if (remainingSeconds <= 0) return undefined

    const timer = window.setTimeout(() => {
      const nextValue = getRemainingCooldown(sessionStorage.getItem(storageKey))
      setRemainingSeconds(nextValue)
      if (nextValue === 0) sessionStorage.removeItem(storageKey)
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [remainingSeconds, storageKey])

  function startCooldown(seconds = 60) {
    const deadline = Date.now() + seconds * 1000
    sessionStorage.setItem(storageKey, String(deadline))
    setRemainingSeconds(seconds)
  }

  return { isCoolingDown: remainingSeconds > 0, remainingSeconds, startCooldown }
}
