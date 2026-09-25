import type { Chat, ChatMessage, MessageStatus } from './types'

export interface ChatState {
  chats: Chat[]
  messages: Record<string, ChatMessage[]>
  activeChatId: string | null
  unread: Record<string, number>
}

export const emptyState: ChatState = { chats: [], messages: {}, activeChatId: null, unread: {} }

export type ChatAction =
  | { type: 'openChat'; chat: Chat }
  | { type: 'selectChat'; chatId: string }
  | { type: 'addMessage'; message: ChatMessage; chatName?: string }
  | { type: 'replaceMessage'; chatId: string; tempId: string; message: ChatMessage }
  | { type: 'setStatus'; idMessage: string; status: MessageStatus }
  | { type: 'reset'; state: ChatState }

const STATUS_RANK: Record<MessageStatus, number> = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 }

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'openChat': {
      const exists = state.chats.some((c) => c.chatId === action.chat.chatId)
      return {
        ...state,
        chats: exists ? state.chats : [action.chat, ...state.chats],
        activeChatId: action.chat.chatId,
        unread: { ...state.unread, [action.chat.chatId]: 0 },
      }
    }
    case 'selectChat':
      return { ...state, activeChatId: action.chatId, unread: { ...state.unread, [action.chatId]: 0 } }

    case 'addMessage': {
      const { message } = action
      const list = state.messages[message.chatId] ?? []
      // The API echoes our own messages back as outgoingAPIMessageReceived — skip duplicates.
      if (list.some((m) => m.id === message.id)) return state

      let chats = state.chats
      const existing = chats.find((c) => c.chatId === message.chatId)
      if (!existing) {
        chats = [{ chatId: message.chatId, title: action.chatName || message.chatId }, ...chats]
      } else if (action.chatName && existing.title === existing.chatId) {
        chats = chats.map((c) => (c.chatId === message.chatId ? { ...c, title: action.chatName! } : c))
      }
      // Move the chat with the newest message to the top.
      chats = [chats.find((c) => c.chatId === message.chatId)!, ...chats.filter((c) => c.chatId !== message.chatId)]

      const isBackground = message.direction === 'in' && state.activeChatId !== message.chatId
      return {
        ...state,
        chats,
        messages: { ...state.messages, [message.chatId]: [...list, message] },
        unread: isBackground
          ? { ...state.unread, [message.chatId]: (state.unread[message.chatId] ?? 0) + 1 }
          : state.unread,
      }
    }
    case 'replaceMessage': {
      const list = state.messages[action.chatId] ?? []
      const withoutEcho = list.filter((m) => m.id !== action.message.id || m.id === action.tempId)
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.chatId]: withoutEcho.map((m) => (m.id === action.tempId ? action.message : m)),
        },
      }
    }
    case 'setStatus': {
      const messages: ChatState['messages'] = {}
      let changed = false
      for (const [chatId, list] of Object.entries(state.messages)) {
        messages[chatId] = list.map((m) => {
          if (m.id !== action.idMessage || !m.status) return m
          if (STATUS_RANK[action.status] <= STATUS_RANK[m.status]) return m
          changed = true
          return { ...m, status: action.status }
        })
      }
      return changed ? { ...state, messages } : state
    }
    case 'reset':
      return action.state
  }
}
