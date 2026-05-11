const getXsrf = () =>
  decodeURIComponent(
    document.cookie.split(';').find(c => c.trim().startsWith('XSRF-TOKEN='))?.split('=')[1] ?? ''
  )

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': getXsrf(),
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

export const api = {
  get:    (url)          => request(url),
  post:   (url, body)    => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (url, body)    => request(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)          => request(url, { method: 'DELETE' }),
}
