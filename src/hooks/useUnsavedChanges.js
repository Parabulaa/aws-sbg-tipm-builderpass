import { useCallback, useEffect, useRef } from 'react'

const defaultMessage = 'You have unsaved event changes. Leave this page and discard them?'

export function useUnsavedChanges(isDirty, message = defaultMessage) {
  const allowNavigationRef = useRef(false)

  useEffect(() => {
    function handleBeforeUnload(event) {
      if (!isDirty || allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = ''
    }

    function handleLinkClick(event) {
      if (!isDirty || allowNavigationRef.current || event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const link = event.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return

      const destination = new URL(link.href, window.location.href)
      if (destination.href === window.location.href) return
      if (window.confirm(message)) {
        allowNavigationRef.current = true
        return
      }

      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleLinkClick, true)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [isDirty, message])

  return useCallback(() => {
    allowNavigationRef.current = true
  }, [])
}
