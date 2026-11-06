export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public retryAfter?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// The API answers 401 only when the app session is missing or expired (provider failures use other codes).
function redirectToLogin() {
  if (typeof window === 'undefined') return
  const { origin, pathname, search } = window.location
  if (pathname.startsWith('/login')) return
  // A full navigation is intended: it drops in-memory caches that belong to the expired session,
  // and this module has no access to the Next router.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign(`${origin}/login?redirectTo=${encodeURIComponent(pathname + search)}`)
}

// Bad gateway, unavailable, gateway timeout: what the Next.js proxy answers while the API is asleep or down.
const GATEWAY_STATUSES = new Set([502, 503, 504])

export const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  // Same origin on purpose: next.config.ts rewrites /api/v1/* to the API (API_URL), so the
  // session cookie set by this app also reaches the API when both run on different domains.
  const url = `/api/v1${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for Better Auth session cookie
  })

  if (!response.ok) {
    if (response.status === 401) redirectToLogin()

    const errorData = await response.json().catch(() => null)
    if (errorData === null && GATEWAY_STATUSES.has(response.status)) {
      throw new ApiError(response.status, 'The DevOS API is starting or unreachable. Try again in a moment.', 'API_UNAVAILABLE')
    }
    const error = errorData?.error
    const message = error?.message || errorData?.message || 'API request failed'
    const retryAfter = typeof error?.retryAfter === 'number' ? error.retryAfter : undefined
    throw new ApiError(response.status, message, typeof error?.code === 'string' ? error.code : undefined, retryAfter)
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  const json = await response.json()
  // If the backend wraps the response in a success envelope, unwrap it
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T
  }

  return json as T
}
