import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone, toChatEvent } from './notifications'
import type { NotificationBody } from './types'

const incoming: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1588091580,
  idMessage: '126543123451133331119',
  senderData: { chatId: '100000123', sender: '100000123', senderName: 'Green API' },
  messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет от Green-API!' } },
}

describe('toChatEvent', () => {
  it('maps an incoming text message', () => {
    expect(toChatEvent(incoming)).toEqual({
      kind: 'message',
      chatName: 'Green API',
      message: {
        id: '126543123451133331119',
        chatId: '100000123',
        text: 'Привет от Green-API!',
        direction: 'in',
        timestamp: 1588091580,
        status: undefined,
      },
    })
  })

  it('reads extended text messages', () => {
    const event = toChatEvent({
      ...incoming,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'со ссылкой https://max.ru' } },
    })
    expect(event?.kind === 'message' && event.message.text).toBe('со ссылкой https://max.ru')
  })

  it('treats messages sent from the phone as outgoing', () => {
    const event = toChatEvent({ ...incoming, typeWebhook: 'outgoingMessageReceived' })
    expect(event?.kind === 'message' && event.message.direction).toBe('out')
  })

  it('ignores media messages and service notifications', () => {
    expect(toChatEvent({ ...incoming, messageData: { typeMessage: 'imageMessage' } })).toBeNull()
    expect(toChatEvent({ typeWebhook: 'stateInstanceChanged' })).toBeNull()
  })

  it('maps delivery statuses', () => {
    expect(toChatEvent({ typeWebhook: 'outgoingMessageStatus', idMessage: 'abc', status: 'read', chatId: '1' })).toEqual({
      kind: 'status',
      idMessage: 'abc',
      status: 'read',
    })
  })
})

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['8 999 123 45 67', '79991234567'],
    ['9991234567', '79991234567'],
    ['+998 90 123 45 67', '998901234567'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it('rejects too short input', () => {
    expect(normalizePhone('12345')).toBeNull()
  })

  it('formats Russian numbers for display', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })
})
