// Vercel serverless entry: adapts the TanStack Start web-fetch handler
// (dist/server/server.js) to Vercel's Node runtime.
import handler from '../dist/server/server.js'

export default async function (req, res) {
  const proto = req.headers['x-forwarded-proto'] ?? 'https'
  const host = req.headers['x-forwarded-host'] ?? req.headers.host
  const url = new URL(req.url, `${proto}://${host}`)

  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    for (const v of Array.isArray(value) ? value : [value]) headers.append(key, v)
  }

  let body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    body = Buffer.concat(chunks)
  }

  const response = await handler.fetch(
    new Request(url, { method: req.method, headers, body }),
    process.env,
    {},
  )

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    if (key === 'set-cookie') return
    res.setHeader(key, value)
  })
  const setCookie = response.headers.getSetCookie?.()
  if (setCookie?.length) res.setHeader('set-cookie', setCookie)

  if (response.body) {
    const reader = response.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
  }
  res.end()
}
