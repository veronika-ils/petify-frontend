export interface LoginRequest {
  username: string
  password: string
}

export interface SignupRequest {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface AuthResult {
  token: string
}

function getBaseUrl(): string {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''
  return base.replace(/\/$/, '')
}

function joinUrl(base: string, path: string): string {
  if (!base) return path
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`
}

function extractToken(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const rec = data as Record<string, unknown>
  const candidates = [rec.token, rec.accessToken, rec.jwt, rec.idToken]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c
  }
  // Sometimes APIs wrap: { data: { token: '...' } }
  const nested = rec.data
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>
    const nestedCandidates = [n.token, n.accessToken, n.jwt, n.idToken]
    for (const c of nestedCandidates) {
      if (typeof c === 'string' && c.trim()) return c
    }
  }
  return null
}

async function postJson<T>(path: string, body: unknown, options?: { signal?: AbortSignal }): Promise<T> {
  const url = joinUrl(getBaseUrl(), path)
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  })

  const text = await res.text()
  let json: unknown = null
  try {
    json = text ? (JSON.parse(text) as unknown) : null
  } catch {
    json = null
  }

  if (!res.ok) {
    const message =
      (json && typeof json === 'object' && typeof (json as any).message === 'string' && (json as any).message) ||
      text ||
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return json as T
}

export async function login(payload: LoginRequest, options?: { signal?: AbortSignal }): Promise<AuthResult> {
  const data = await postJson<unknown>('/api/auth/login', payload, options)
  const token = extractToken(data)
  if (!token) {
    throw new Error('Login succeeded but no token was returned')
  }
  return { token }
}

export async function signup(payload: SignupRequest, options?: { signal?: AbortSignal }): Promise<AuthResult> {
  const data = await postJson<unknown>('/api/auth/signup', payload, options)
  const token = extractToken(data)
  if (!token) {
    // Some APIs return 201 with no token; treat as success but unauthenticated.
    // Caller can redirect to login.
    return { token: '' }
  }
  return { token }
}
