import { useState, type FormEvent } from 'react'
import { formatPhone, normalizePhone } from '../lib/notifications'
import type { Chat, ChatMessage } from '../lib/types'
import { Avatar } from './Avatar'
import { LogoMark } from './LoginForm'

interface Props {
  chats: Chat[]
  messages: Record<string, ChatMessage[]>
  unread: Record<string, number>
  activeChatId: string | null
  idInstance: string
  connectionError: string | null
  onSelect: (chatId: string) => void
  onCreateChat: (phone: string) => Promise<void>
  onLogout: () => void
}

export function Sidebar({ chats, messages, unread, activeChatId, idInstance, connectionError, onSelect, onCreateChat, onLogout }: Props) {
  const [showForm, setShowForm] = useState(chats.length === 0)
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const digits = normalizePhone(phone)
    if (!digits) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await onCreateChat(digits)
      setPhone('')
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать чат')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="brand">
          <LogoMark />
          <span>Чаты</span>
        </div>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setShowForm((v) => !v)}
          aria-label="Новый чат"
          title="Новый чат"
        >
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      </header>

      {showForm && (
        <form className="new-chat" onSubmit={handleSubmit}>
          <label htmlFor="new-chat-phone">Номер получателя</label>
          <div className="new-chat-row">
            <input
              id="new-chat-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 999 123-45-67"
              inputMode="tel"
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={loading || !phone.trim()}>
              {loading ? '…' : 'Создать'}
            </button>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
        </form>
      )}

      {connectionError && <p className="banner-error" role="status">Нет связи с GREEN-API: {connectionError}</p>}

      <ul className="chat-list">
        {chats.length === 0 && !showForm && <li className="chat-list-empty">Нет чатов. Нажмите «+», чтобы начать.</li>}
        {chats.map((chat) => {
          const last = messages[chat.chatId]?.at(-1)
          const count = unread[chat.chatId] ?? 0
          return (
            <li key={chat.chatId}>
              <button
                type="button"
                className={`chat-item${chat.chatId === activeChatId ? ' active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <Avatar title={chat.title} />
                <span className="chat-item-body">
                  <span className="chat-item-top">
                    <span className="chat-item-title">{chat.title}</span>
                    {last && <span className="chat-item-time">{formatTime(last.timestamp)}</span>}
                  </span>
                  <span className="chat-item-bottom">
                    <span className="chat-item-preview">
                      {last ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}` : chat.phone ? formatPhone(chat.phone) : ''}
                    </span>
                    {count > 0 && <span className="badge">{count}</span>}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <footer className="sidebar-footer">
        <span className="instance">Инстанс {idInstance}</span>
        <button type="button" className="link-btn" onClick={onLogout}>
          Выйти
        </button>
      </footer>
    </aside>
  )
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  const now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}
