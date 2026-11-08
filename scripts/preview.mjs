import { createServer } from 'node:http'
import { localDatabase } from './local-d1.mjs'
import worker from '../dist/server/index.js'

const port = Number(process.argv[2] || 8768)
const origin = 'http://127.0.0.1:' + port
const env = { DB: localDatabase() }
createServer(async (incoming, outgoing) => {
  try {
    const request = new Request(origin + incoming.url, { method: incoming.method })
    const response = await worker.fetch(request, env)
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    outgoing.end(Buffer.from(await response.arrayBuffer()))
  } catch {
    outgoing.writeHead(500).end()
  }
}).listen(port, '127.0.0.1', () => console.log(origin))
