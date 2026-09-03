export function createActionLock() {
  let isLocked = false

  return {
    acquire() {
      if (isLocked) return false
      isLocked = true
      return true
    },
    release() {
      isLocked = false
    },
  }
}
