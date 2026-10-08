import { describe, expect, it } from 'vitest'
import { allowRequest, authorizationToken, messageSchema } from './assistant.js'

describe('assistant request validation', () => {
  it('requires a well-formed bearer authorization header', () => {
    expect(authorizationToken('Bearer abc.def')).toBe('abc.def')
    expect(authorizationToken('Basic abc')).toBeNull()
    expect(authorizationToken(undefined)).toBeNull()
  })

  it('validates message text and bounds chat history', () => {
    expect(messageSchema.safeParse({ message: 'Help me plan today' }).success).toBe(true)
    expect(messageSchema.safeParse({ message: '  ' }).success).toBe(false)
    expect(messageSchema.safeParse({ message: 'x'.repeat(1201) }).success).toBe(false)
    expect(messageSchema.safeParse({ message: 'Help', history: Array.from({ length: 13 }, () => ({ role: 'user', content: 'Hi' })) }).success).toBe(false)
  })

  it('limits each user to 30 messages in five minutes', () => {
    const start = 1_800_000_000_000
    const userId = `limit-test-${start}`
    for (let index = 0; index < 30; index += 1) {
      expect(allowRequest(userId, start + index)).toBe(true)
    }
    expect(allowRequest(userId, start + 31)).toBe(false)
    expect(allowRequest(userId, start + 5 * 60_000 + 1)).toBe(true)
  })
})
