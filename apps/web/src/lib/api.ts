export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const fetchApi = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  const url = `${baseUrl}/api/v1${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Important for Better Auth session cookie
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new ApiError(response.status, errorData.message || 'API request failed')
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}
