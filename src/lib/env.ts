function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and set a value.`,
    )
  }
  return value
}

export const env = {
  get apiBaseUrl() {
    return requireEnv('VITE_API_BASE_URL', import.meta.env.VITE_API_BASE_URL)
  },
  get organizationId() {
    return requireEnv(
      'VITE_ORGANIZATION_ID',
      import.meta.env.VITE_ORGANIZATION_ID,
    )
  },
}
