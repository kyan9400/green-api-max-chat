import { emptyState, type ChatState } from './chatState'
import type { Credentials } from './types'

const CREDS_KEY = 'green-api-max-chat:credentials'
const chatsKey = (idInstance: string) => `green-api-max-chat:chats:${idInstance}`

// Storage can throw in private mode or when disabled; the app must still work without it.
function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

export const loadCredentials = () => read<Credentials>(CREDS_KEY)
export const saveCredentials = (creds: Credentials | null) => write(CREDS_KEY, creds)

export function loadChats(idInstance: string): ChatState {
  return { ...emptyState, ...read<ChatState>(chatsKey(idInstance)), activeChatId: null }
}

export const saveChats = (idInstance: string, state: ChatState) => write(chatsKey(idInstance), state)
