import { useEffect, useRef } from 'react'
import type { MessengerClient } from './greenApi'
import { toChatEvent, type ChatEvent } from './notifications'

const RETRY_DELAY_MS = 3000

/**
 * Receives messages through the GREEN-API HTTP API:
 * ReceiveNotification (long poll) -> handle -> DeleteNotification, in a loop.
 * Every notification is deleted, including ones the app ignores, so the queue never gets stuck.
 */
export function useNotifications(
  client: MessengerClient | null,
  onEvent: (event: ChatEvent) => void,
  onError: (error: Error | null) => void,
): void {
  const onEventRef = useRef(onEvent)
  const onErrorRef = useRef(onError)
  useEffect(() => {
    onEventRef.current = onEvent
    onErrorRef.current = onError
  })

  useEffect(() => {
    if (!client) return
    const controller = new AbortController()
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    async function loop() {
      while (!controller.signal.aborted) {
        try {
          const notification = await client!.receiveNotification(5, controller.signal)
          onErrorRef.current(null)
          if (!notification) continue
          const event = toChatEvent(notification.body)
          if (event) onEventRef.current(event)
          await client!.deleteNotification(notification.receiptId)
        } catch (error) {
          if (controller.signal.aborted) return
          onErrorRef.current(error instanceof Error ? error : new Error(String(error)))
          await sleep(RETRY_DELAY_MS)
        }
      }
    }

    loop()
    return () => controller.abort()
  }, [client])
}
