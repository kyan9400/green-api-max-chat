import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { formatPhone } from '../lib/notifications'
import type { Chat, ChatMessage, MessageStatus } from '../lib/types'
import { Avatar } from './Avatar'

interface Props {
  chat: Chat
  messages: ChatMessage[]
  onSend: (text: string) => void
  onBack: () => void
}

export function ChatWindow({ chat, messages, onSend, onBack }: Props) {
  const [text, setText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages.length, chat.chatId])

  useEffect(() => {
    inputRef.current?.focus()
  }, [chat.chatId])

  const subtitle = chat.phone && chat.title !== formatPhone(chat.phone) ? formatPhone(chat.phone) : 'MAX'

  function submit(e?: FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value) return
    onSend(value)
    setText('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat">
      <header className="chat-header">
        <button type="button" className="icon-btn back-btn" onClick={onBack} aria-label="Назад к чатам">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <Avatar title={chat.title} size={40} />
        <div className="chat-header-text">
          <span className="chat-header-title">{chat.title}</span>
          <span className="chat-header-sub">{subtitle}</span>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && <p className="messages-empty">Сообщений пока нет. Напишите первым!</p>}
        {messages.map((m, i) => {
          const prev = messages[i - 1]
          const showDate = !prev || new Date(prev.timestamp * 1000).toDateString() !== new Date(m.timestamp * 1000).toDateString()
          return (
            <div key={m.id}>
              {showDate && <div className="date-divider"><span>{formatDate(m.timestamp)}</span></div>}
              <div className={`bubble-row ${m.direction}`}>
                <div className={`bubble ${m.direction}${m.status === 'failed' ? ' failed' : ''}`}>
                  <span className="bubble-text">{m.text}</span>
                  <span className="bubble-meta">
                    {new Date(m.timestamp * 1000).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    {m.direction === 'out' && m.status && <StatusIcon status={m.status} />}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          rows={1}
          aria-label="Текст сообщения"
        />
        <button type="submit" className="send-btn" disabled={!text.trim()} aria-label="Отправить">
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 12l16-8-6 16-2.5-6.5L4 12z" fill="currentColor" /></svg>
        </button>
      </form>
    </section>
  )
}

function StatusIcon({ status }: { status: MessageStatus }) {
  const label: Record<MessageStatus, string> = {
    pending: 'Отправляется',
    sent: 'Отправлено',
    delivered: 'Доставлено',
    read: 'Прочитано',
    failed: 'Ошибка отправки',
  }
  const icon = status === 'pending' ? '🕓' : status === 'failed' ? '⚠' : status === 'sent' ? '✓' : '✓✓'
  return (
    <span className={`status status-${status}`} title={label[status]} aria-label={label[status]}>
      {icon}
    </span>
  )
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Сегодня'
  if (d.toDateString() === yesterday.toDateString()) return 'Вчера'
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}
