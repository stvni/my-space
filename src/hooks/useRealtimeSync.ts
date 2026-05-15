import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Subscribe to any Postgres change on the given table.
 * `onUpdate` fires on INSERT / UPDATE / DELETE.
 * The channel is cleaned up on unmount or when table/onUpdate changes.
 */
export function useRealtimeSync(table: string, onUpdate: () => void): void {
  // Keep a stable ref so changing the callback doesn't re-subscribe
  const cbRef = useRef(onUpdate)
  useEffect(() => { cbRef.current = onUpdate })

  useEffect(() => {
    const channel = supabase
      .channel(`${table}_sync_${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => cbRef.current(),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table])
}
