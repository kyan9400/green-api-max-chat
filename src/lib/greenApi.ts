import type { Credentials, Notification } from './types'

export const DEFAULT_API_URL = 'https://api.green-api.com/v3'
export const DEMO_INSTANCE = 'demo'

/** The subset of GREEN-API methods the chat uses. Implemented by GreenApiClient and DemoClient. */
export interface MessengerClient {
  getStateInstance(): Promise<{ stateInstance: string }>
  checkAccount(phoneNumber: number): Promise<{ exist: boolean; chatId?: string }>
  sendMessage(chatId: string, message: string): Promise<{ idMessage: string }>
  receiveNotification(receiveTimeout?: number, signal?: AbortSignal): Promise<Notification | null>
  deleteNotification(receiptId: number): Promise<{ result: boolean }>
}

export class GreenApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

/**
 * Minimal client for the GREEN-API MAX methods this app needs.
 * Docs: https://green-api.com/v3/docs/api/
 */
export class GreenApiClient implements MessengerClient {
  private readonly creds: Credentials

  constructor(creds: Credentials) {
    this.creds = { ...creds, apiUrl: creds.apiUrl.replace(/\/+$/, '') }
  }

  private url(method: string, suffix = ''): string {
    const { apiUrl, idInstance, apiTokenInstance } = this.creds
    return `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}`
  }

  private async request<T>(method: string, init?: RequestInit, suffix = ''): Promise<T> {
    const res = await fetch(this.url(method, suffix), {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
    const text = await res.text()
    if (!res.ok) {
      throw new GreenApiError(describeError(res.status, text), res.status)
    }
    return (text ? JSON.parse(text) : null) as T
  }

  /** Instance state: "authorized" means the MAX account is connected. */
  getStateInstance(): Promise<{ stateInstance: string }> {
    return this.request('getStateInstance')
  }

  /** Resolves a phone number to a MAX chatId. */
  checkAccount(phoneNumber: number): Promise<{ exist: boolean; chatId?: string }> {
    return this.request('checkAccount', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    })
  }

  sendMessage(chatId: string, message: string): Promise<{ idMessage: string }> {
    return this.request('sendMessage', {
      method: 'POST',
      body: JSON.stringify({ chatId, message }),
    })
  }

  /** Long-polls the notification queue; resolves to null when the queue is empty. */
  receiveNotification(receiveTimeout = 5, signal?: AbortSignal): Promise<Notification | null> {
    return this.request('receiveNotification', { signal }, `?receiveTimeout=${receiveTimeout}`)
  }

  deleteNotification(receiptId: number): Promise<{ result: boolean }> {
    return this.request('deleteNotification', { method: 'DELETE' }, `/${receiptId}`)
  }
}

function describeError(status: number, body: string): string {
  if (status === 401 || status === 403) return 'Неверный idInstance или apiTokenInstance'
  if (status === 466) return 'Исчерпан лимит запросов тарифа GREEN-API'
  try {
    const parsed = JSON.parse(body) as { message?: string }
    if (parsed.message) return parsed.message
  } catch {
    // body is not JSON
  }
  return `Ошибка GREEN-API (HTTP ${status})`
}
