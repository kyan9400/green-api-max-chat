export interface Credentials {
  apiUrl: string
  idInstance: string
  apiTokenInstance: string
}

export type MessageDirection = 'in' | 'out'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface ChatMessage {
  id: string
  chatId: string
  text: string
  direction: MessageDirection
  timestamp: number // unix seconds
  status?: MessageStatus
}

export interface Chat {
  chatId: string
  title: string
  phone?: string
}

/** A single notification from the GREEN-API HTTP API queue. */
export interface Notification {
  receiptId: number
  body: NotificationBody
}

export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  chatId?: string
  status?: string
  senderData?: {
    chatId: string
    sender?: string
    chatName?: string
    senderName?: string
    senderContactName?: string
  }
  messageData?: {
    typeMessage: string
    textMessageData?: { textMessage: string }
    extendedTextMessageData?: { text: string }
  }
}
