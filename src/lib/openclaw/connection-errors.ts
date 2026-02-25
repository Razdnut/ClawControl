function getDefaultOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return 'app://localhost'
}

export function getOriginAllowlistCandidates(currentOrigin: string = getDefaultOrigin()): string[] {
  const normalized = currentOrigin.trim()
  const candidates = [normalized]

  // Some OpenClaw deployments only accept http(s)-scheme origins in allowlists.
  // When the desktop app origin is app://localhost, suggest localhost http(s)
  // variants as a pragmatic fallback that many gateways accept.
  if (normalized === 'app://localhost') {
    candidates.push('https://localhost', 'http://localhost')
  }

  return [...new Set(candidates.filter(Boolean))]
}

export function buildAllowedOriginsCommand(currentOrigin: string = getDefaultOrigin()): string {
  const origins = getOriginAllowlistCandidates(currentOrigin)
  return `openclaw config set gateway.controlUi.allowedOrigins '${JSON.stringify(origins)}'`
}

export function formatConnectionError(error: unknown, currentOrigin: string = getDefaultOrigin()): string {
  const raw = error instanceof Error ? error.message : String(error || 'Connection failed')
  const normalized = raw.trim()

  if (isOriginMismatch(normalized)) {
    return [
      'Connection blocked: origin not allowed by the OpenClaw gateway.',
      `Current app origin: ${currentOrigin}`,
      `Run on the OpenClaw host: ${buildAllowedOriginsCommand(currentOrigin)}`,
      'If it still fails, verify the effective config with: openclaw config get gateway.controlUi.allowedOrigins',
      'Then restart the gateway.'
    ].join('\n')
  }

  return normalized || 'Connection failed'
}

function isOriginMismatch(message: string): boolean {
  const lower = message.toLowerCase()
  if (lower.includes('origin not allowed') || lower.includes('origin-mismatch')) return true

  // Some runtimes stringify structured close payloads as JSON fragments.
  return /"cause"\s*:\s*"origin-mismatch"/i.test(message)
}
