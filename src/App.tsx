import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { ChatWindow } from './components/ChatWindow'
import { LoginForm } from './components/LoginForm'
import { Sidebar } from './components/Sidebar'
import { chatReducer, emptyState } from './lib/chatState'
import { DemoClient } from './lib/demoClient'
import { DEMO_INSTANCE, GreenApiClient } from './lib/greenApi'
import { formatPhone, type ChatEvent } from './lib/notifications'
import { loadChats, loadCredentials, saveChats, saveCredentials } from './lib/storage'
import type { Credentials } from './lib/types'
import { useNotifications } from './lib/useNotifications'

export default function App() {
  const [creds, setCreds] = useState<Credentials | null>(loadCredentials)
  const [state, dispatch] = useReducer(chatReducer, emptyState)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const client = useMemo(() => {
    if (!creds) return null
    return creds.idInstance === DEMO_INSTANCE ? new DemoClient() : new GreenApiClient(creds)
  }, [creds])

  // Load this instance's chat history on login, persist it on change.
  useEffect(() => {
    dispatch({ type: 'reset', state: creds ? loadChats(creds.idInstance) : emptyState })
  }, [creds])
  useEffect(() => {
    if (creds) saveChats(creds.idInstance, state)
  }, [creds, state])

  const handleEvent = useCallback((event: ChatEvent) => {
    if (event.kind === 'message') dispatch({ type: 'addMessage', message: event.message, chatName: event.chatName })
    else dispatch({ type: 'setStatus', idMessage: event.idMessage, status: event.status })
  }, [])
  const handleError = useCallback((error: Error | null) => setConnectionError(error?.message ?? null), [])
  useNotifications(client, handleEvent, handleError)

  function login(next: Credentials) {
    saveCredentials(next)
    setCreds(next)
  }

  function logout() {
    saveCredentials(null)
    setCreds(null)
  }

  async function createChat(phone: string) {
    const result = await client!.checkAccount(Number(phone))
    if (!result.exist || !result.chatId) throw new Error('У этого номера нет аккаунта MAX')
    dispatch({ type: 'openChat', chat: { chatId: result.chatId, title: formatPhone(phone), phone } })
  }

  async function sendMessage(chatId: string, text: string) {
    const tempId = `pending-${Date.now()}`
    const draft = { id: tempId, chatId, text, direction: 'out' as const, timestamp: Math.floor(Date.now() / 1000) }
    dispatch({ type: 'addMessage', message: { ...draft, status: 'pending' } })
    try {
      const { idMessage } = await client!.sendMessage(chatId, text)
      dispatch({ type: 'replaceMessage', chatId, tempId, message: { ...draft, id: idMessage, status: 'sent' } })
    } catch {
      dispatch({ type: 'replaceMessage', chatId, tempId, message: { ...draft, status: 'failed' } })
    }
  }

  if (!creds) return <LoginForm onLogin={login} />

  const activeChat = state.chats.find((c) => c.chatId === state.activeChatId)

  return (
    <div className={`app${activeChat ? ' has-active-chat' : ''}`}>
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        unread={state.unread}
        activeChatId={state.activeChatId}
        idInstance={creds.idInstance}
        connectionError={connectionError}
        onSelect={(chatId) => dispatch({ type: 'selectChat', chatId })}
        onCreateChat={createChat}
        onLogout={logout}
      />
      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          messages={state.messages[activeChat.chatId] ?? []}
          onSend={(text) => sendMessage(activeChat.chatId, text)}
          onBack={() => dispatch({ type: 'selectChat', chatId: '' })}
        />
      ) : (
        <section className="chat chat-placeholder">
          <p>Выберите чат или создайте новый по номеру телефона</p>
        </section>
      )}
    </div>
  )
}
