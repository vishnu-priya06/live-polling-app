const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function buildRequestUrl(path) {
  if (!path) {
    return path
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return path.startsWith('/') ? path : `/${path.replace(/^\/+/, '')}`
}

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
}

const authFailureListeners = new Set()

export function subscribeToAuthFailure(listener) {
  authFailureListeners.add(listener)

  return () => authFailureListeners.delete(listener)
}

function notifyAuthFailure() {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
  localStorage.removeItem(STORAGE_KEYS.USER)
  window.dispatchEvent(new CustomEvent('live-polling:auth-failure'))
  authFailureListeners.forEach((listener) => listener())
}

async function request(path, options = {}) {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
  const headers = new Headers(options.headers || {})

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const requestUrl = `${API_BASE_URL}${buildRequestUrl(path)}`

  const response = await fetch(requestUrl, {
    ...options,
    headers,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : await response.text().catch(() => '')

  if (!response.ok) {
    if (response.status === 401) {
      notifyAuthFailure()
    }

    const message = payload?.error || payload?.message || 'Request failed'
    throw new Error(message)
  }

  return payload
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  put: (path, body) => request(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  patch: (path, body) => request(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  del: (path) => request(path, { method: 'DELETE' }),
}
