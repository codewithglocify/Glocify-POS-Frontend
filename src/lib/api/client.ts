import { clearSession, getAccessToken } from '#/lib/auth'
import { env } from '#/lib/env'

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type RequestOptions = {
  method?: string
  body?: unknown
  query?: Record<string, string | undefined>
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = getAccessToken()
  if (!token) {
    throw new ApiError('Not authenticated', 401)
  }

  const url = new URL(
    `${env.apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`,
  )
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value != null && value !== '') {
        url.searchParams.set(key, value)
      }
    }
  }

  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.body !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (response.status === 401) {
    clearSession()
    throw new ApiError('Session expired. Please sign in again.', 401)
  }

  if (response.status === 204) {
    return undefined as T
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const errorBody = (await response.json()) as { message?: string }
      if (errorBody.message) {
        message = errorBody.message
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, response.status)
  }

  if (response.headers.get('content-type')?.includes('application/json')) {
    return (await response.json()) as T
  }

  return undefined as T
}
