import { useEffect, useState } from 'react'

export function useObjectUrl(file) {
  const [objectUrl, setObjectUrl] = useState('')

  useEffect(() => {
    if (!file) {
      setObjectUrl('')
      return undefined
    }

    const nextObjectUrl = URL.createObjectURL(file)
    setObjectUrl(nextObjectUrl)

    return () => URL.revokeObjectURL(nextObjectUrl)
  }, [file])

  return objectUrl
}
