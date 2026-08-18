import { useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'

export const POLL_INTERVAL_MS = 3000

export function useProductPoll(enabled: boolean): void {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) {
      return
    }

    const intervalId = setInterval(() => {
      void router.invalidate()
    }, POLL_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [enabled, router])
}
