const getXsrf = () => {
  const raw = document.cookie
    .split(';')
    .find(c => c.trim().startsWith('XSRF-TOKEN='))
  if (!raw) return ''
  // Use slice(1).join('=') to handle '=' characters inside the base64 value
  const value = raw.trim().split('=').slice(1).join('=')
  try { return decodeURIComponent(value) } catch { return value }
}

const getAuthToken = () => localStorage.getItem('bachesito.auth.token')

function authHeaders(extra = {}) {
  const token = getAuthToken()
  return {
    'Accept':        'application/json',
    'X-XSRF-TOKEN':  getXsrf(),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      ...authHeaders({ 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...options,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }))
    throw new Error(err.message || `Error ${res.status}`)
  }

  return res.json()
}

// For FormData / file uploads — no Content-Type (browser sets multipart boundary)
async function upload(url, formData) {
  // Refresh CSRF cookie before upload to ensure token is fresh
  await fetch('/sanctum/csrf-cookie', { credentials: 'include' })

  const res = await fetch(url, {
    method:      'POST',
    credentials: 'include',
    headers:     authHeaders(), // no Content-Type — browser sets it with boundary
    body:        formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }))
    throw new Error(err.message || `Error ${res.status}`)
  }

  return res.json()
}

async function destroy(url) {
  // Refresh CSRF cookie before DELETE
  await fetch('/sanctum/csrf-cookie', { credentials: 'include' })

  const res = await fetch(url, {
    method:      'DELETE',
    credentials: 'include',
    headers:     authHeaders(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Error ${res.status}` }))
    throw new Error(err.message || `Error ${res.status}`)
  }

  return res.json()
}

export const api = {
  get:    (url)           => request(url),
  post:   (url, body)     => request(url, { method: 'POST',  body: JSON.stringify(body) }),
  patch:  (url, body)     => request(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url)           => destroy(url),
  upload: (url, formData) => upload(url, formData),
}
