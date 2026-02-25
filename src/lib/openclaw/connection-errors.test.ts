import { describe, expect, it } from 'vitest'
import { buildAllowedOriginsCommand, formatConnectionError, getOriginAllowlistCandidates } from './connection-errors'

describe('formatConnectionError', () => {
  it('formats origin mismatch errors with actionable guidance', () => {
    const err = new Error('{"cause":"origin-mismatch","reason":"origin not allowed"}')

    const msg = formatConnectionError(err, 'app://localhost')

    expect(msg).toContain('origin not allowed')
    expect(msg).toContain('app://localhost')
    expect(msg).toContain('gateway.controlUi.allowedOrigins')
    expect(msg).toContain('https://localhost')
  })

  it('passes through non-origin errors', () => {
    const msg = formatConnectionError(new Error('Connection timed out'), 'app://localhost')
    expect(msg).toBe('Connection timed out')
  })
})

describe('origin allowlist helpers', () => {
  it('adds localhost http(s) fallbacks for app protocol origin', () => {
    expect(getOriginAllowlistCandidates('app://localhost')).toEqual([
      'app://localhost',
      'https://localhost',
      'http://localhost'
    ])
  })

  it('builds a valid openclaw config command', () => {
    expect(buildAllowedOriginsCommand('https://demo.local')).toBe(
      `openclaw config set gateway.controlUi.allowedOrigins '["https://demo.local"]'`
    )
  })
})
