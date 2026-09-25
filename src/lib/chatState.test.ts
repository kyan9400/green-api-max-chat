import { describe, expect, it } from 'vitest'
import { chatReducer, emptyState, type ChatState } from './chatState'
import type { ChatMessage } from './types'

const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: 'm1',
  chatId: '100',
  text: 'hi',
  direction: 'in',
  timestamp: 1,
  ...over,
})

describe('chatReducer', () => {
  it('creates a chat for a message from an unknown sender and counts it as unread', () => {
    const state = chatReducer(emptyState, { type: 'addMessage', message: msg({}), chatName: 'Анна' })
    expect(state.chats).toEqual([{ chatId: '100', title: 'Анна' }])
    expect(state.unread['100']).toBe(1)
  })

  it('does not count messages in the open chat as unread', () => {
    let state = chatReducer(emptyState, { type: 'openChat', chat: { chatId: '100', title: '+7 999' } })
    state = chatReducer(state, { type: 'addMessage', message: msg({}) })
    expect(state.unread['100']).toBe(0)
  })

  it('ignores duplicate message ids (API echo of our own message)', () => {
    let state = chatReducer(emptyState, { type: 'addMessage', message: msg({ id: 'x', direction: 'out' }) })
    state = chatReducer(state, { type: 'addMessage', message: msg({ id: 'x', direction: 'out' }) })
    expect(state.messages['100']).toHaveLength(1)
  })

  it('replaces the pending message and drops an echo that arrived first', () => {
    let state: ChatState = chatReducer(emptyState, {
      type: 'addMessage',
      message: msg({ id: 'pending-1', direction: 'out', status: 'pending' }),
    })
    state = chatReducer(state, { type: 'addMessage', message: msg({ id: 'real', direction: 'out', status: 'sent' }) })
    state = chatReducer(state, {
      type: 'replaceMessage',
      chatId: '100',
      tempId: 'pending-1',
      message: msg({ id: 'real', direction: 'out', status: 'sent' }),
    })
    expect(state.messages['100'].map((m) => m.id)).toEqual(['real'])
  })

  it('only moves message status forward', () => {
    let state = chatReducer(emptyState, { type: 'addMessage', message: msg({ id: 'a', direction: 'out', status: 'sent' }) })
    state = chatReducer(state, { type: 'setStatus', idMessage: 'a', status: 'read' })
    state = chatReducer(state, { type: 'setStatus', idMessage: 'a', status: 'delivered' })
    expect(state.messages['100'][0].status).toBe('read')
  })
})
