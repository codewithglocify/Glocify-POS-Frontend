import { env } from '#/lib/env'

const ACCESS_TOKEN_KEY = 'corepos.accessToken'
const REFRESH_TOKEN_KEY = 'corepos.refreshToken'
const EXPIRES_IN_KEY = 'corepos.expiresIn'

export type AuthSession = {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export type LoginCredentials = {
  email: string
  password: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

export async function login({
  email,
  password,
}: LoginCredentials): Promise<AuthSession> {
  const response = await fetch(`${env.apiBaseUrl}/admin/v1/session/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      organizationId: env.organizationId,
      email,
      password,
    }),
  })

  if (response.status === 401) {
    throw new AuthError('Invalid email or password', 401)
  }

  if (response.status === 403) {
    throw new AuthError('This account is not allowed to access the admin console', 403)
  }

  if (!response.ok) {
    throw new AuthError(
      `Login failed (${response.status}). Please try again.`,
      response.status,
    )
  }

  const data = (await response.json()) as {
    accessToken?: string
    refreshToken?: string
    expiresIn?: number
  }

  if (!data.accessToken || !data.refreshToken || data.expiresIn == null) {
    throw new AuthError('Login response was missing required token fields')
  }

  const session: AuthSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresIn: data.expiresIn,
  }

  saveSession(session)
  return session
}

export async function logout(): Promise<void> {
  const session = getSession()
  if (!session) {
    return
  }

  try {
    await fetch(`${env.apiBaseUrl}/admin/v1/session/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
  } finally {
    clearSession()
  }
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
  localStorage.setItem(EXPIRES_IN_KEY, String(session.expiresIn))
}

export function getSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  const expiresInRaw = localStorage.getItem(EXPIRES_IN_KEY)

  if (!accessToken || !refreshToken || !expiresInRaw) {
    return null
  }

  const expiresIn = Number(expiresInRaw)
  if (!Number.isFinite(expiresIn)) {
    return null
  }

  return { accessToken, refreshToken, expiresIn }
}

export function clearSession(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(EXPIRES_IN_KEY)
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null
}
