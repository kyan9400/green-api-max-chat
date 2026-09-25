import type { MessengerClient } from './greenApi'
import type { Notification } from './types'

const REPLIES = [
  'Привет! Получил твоё сообщение 👋',
  'Это демо-режим: ответ пришёл через очередь уведомлений, как в GREEN-API.',
  'В реальном режиме отвечает живой собеседник из MAX.',
]

/**
 * Offline stand-in for GreenApiClient so the UI can be tried without a GREEN-API instance.
 * Each sent message produces the same notifications the real API would:
 * outgoingMessageStatus (delivered, read) and an incomingMessageReceived reply.
 */
export class DemoClient implements MessengerClient {
  private queue: Notification[] = []
  private waiters: Array<() => void> = []
  private receipt = 1
  private replyIndex = 0

  async getStateInstance() {
    return { stateInstance: 'authorized' }
  }

  async checkAccount(phoneNumber: number) {
    return { exist: true, chatId: `demo${phoneNumber}` }
  }

  async sendMessage(chatId: string, _message: string) {
    const idMessage = `demo-out-${Date.now()}`
    const now = () => Math.floor(Date.now() / 1000)
    this.later(600, { typeWebhook: 'outgoingMessageStatus', idMessage, chatId, status: 'delivered', timestamp: now() })
    this.later(1400, { typeWebhook: 'outgoingMessageStatus', idMessage, chatId, status: 'read', timestamp: now() })
    this.later(2200, {
      typeWebhook: 'incomingMessageReceived',
      idMessage: `demo-in-${Date.now()}`,
      timestamp: now(),
      senderData: { chatId, sender: chatId, senderName: 'Демо-собеседник' },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: REPLIES[this.replyIndex++ % REPLIES.length] } },
    })
    return { idMessage }
  }

  async receiveNotification(receiveTimeout = 5, signal?: AbortSignal): Promise<Notification | null> {
    if (!this.queue.length) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, receiveTimeout * 1000)
        signal?.addEventListener('abort', () => { clearTimeout(timer); resolve() })
        this.waiters.push(() => { clearTimeout(timer); resolve() })
      })
    }
    return this.queue[0] ?? null
  }

  async deleteNotification(receiptId: number) {
    this.queue = this.queue.filter((n) => n.receiptId !== receiptId)
    return { result: true }
  }

  private later(ms: number, body: Notification['body']) {
    setTimeout(() => {
      this.queue.push({ receiptId: this.receipt++, body: { ...body, timestamp: Math.floor(Date.now() / 1000) } })
      this.waiters.splice(0).forEach((wake) => wake())
    }, ms)
  }
}
