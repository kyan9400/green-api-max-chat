import type { ChatMessage, MessageStatus, NotificationBody } from './types'

export type ChatEvent =
  | { kind: 'message'; message: ChatMessage; chatName?: string }
  | { kind: 'status'; idMessage: string; status: MessageStatus }

const STATUS_MAP: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
}

export function extractText(body: NotificationBody): string | null {
  const data = body.messageData
  if (!data) return null
  if (data.typeMessage === 'textMessage') return data.textMessageData?.textMessage ?? null
  if (data.typeMessage === 'extendedTextMessage') return data.extendedTextMessageData?.text ?? null
  return null
}

/**
 * Turns a raw notification into something the chat UI understands.
 * Returns null for notifications the app ignores (media, instance state, etc.).
 *
 * - incomingMessageReceived: a reply from the recipient
 * - outgoingMessageReceived: a message sent from the MAX app on the phone
 * - outgoingAPIMessageReceived: an echo of a message sent through the API (deduplicated by id)
 * - outgoingMessageStatus: delivery / read receipts
 */
export function toChatEvent(body: NotificationBody): ChatEvent | null {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived': {
      const text = extractText(body)
      const chatId = body.senderData?.chatId
      if (text === null || !chatId || !body.idMessage) return null
      return {
        kind: 'message',
        chatName:
          body.typeWebhook === 'incomingMessageReceived'
            ? body.senderData?.senderContactName || body.senderData?.senderName || body.senderData?.chatName
            : body.senderData?.chatName,
        message: {
          id: body.idMessage,
          chatId,
          text,
          direction: body.typeWebhook === 'incomingMessageReceived' ? 'in' : 'out',
          timestamp: body.timestamp ?? Math.floor(Date.now() / 1000),
          status: body.typeWebhook === 'incomingMessageReceived' ? undefined : 'sent',
        },
      }
    }
    case 'outgoingMessageStatus': {
      const status = body.status && STATUS_MAP[body.status]
      if (!status || !body.idMessage) return null
      return { kind: 'status', idMessage: body.idMessage, status }
    }
    default:
      return null
  }
}

/** Accepts "+7 (999) 123-45-67", "8 999 123 45 67", etc. Returns digits in international format. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

export function formatPhone(digits: string): string {
  const m = digits.match(/^7(\d{3})(\d{3})(\d{2})(\d{2})$/)
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : `+${digits}`
}
