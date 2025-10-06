/**
 * Node.js HTTP Server Adapter for Cloudflare Workers
 * This file allows running the Cloudflare Workers application in a Node.js environment
 */

/* eslint-disable no-console */
import { Buffer } from 'node:buffer'
import http from 'node:http'
import process from 'node:process'
import { handleRequest } from './app.js'

const PORT = process.env.PORT || 3000
const HOST = process.env.HOST || '0.0.0.0'

// Convert Node.js IncomingMessage to Fetch API Request
function createFetchRequest(req: http.IncomingMessage): Request {
  const protocol = 'http' // Use 'https' if you have SSL setup
  const host = req.headers.host || `localhost:${PORT}`
  const url = `${protocol}://${host}${req.url}`

  const headers = new Headers()
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v))
      }
      else {
        headers.append(key, value)
      }
    }
  })

  const init: RequestInit = {
    method: req.method,
    headers,
  }

  // Add body for POST, PUT, PATCH requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Promise<Request>((resolve) => {
      const chunks: Buffer[] = []
      req.on('data', chunk => chunks.push(chunk))
      req.on('end', () => {
        init.body = Buffer.concat(chunks).toString()
        resolve(new Request(url, init))
      })
    }) as any // Type assertion to match synchronous return
  }

  return new Request(url, init)
}

// Convert Fetch API Response to Node.js ServerResponse
async function sendFetchResponse(res: http.ServerResponse, fetchResponse: Response): Promise<void> {
  res.statusCode = fetchResponse.status

  // Set headers
  fetchResponse.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })

  // Send body
  if (fetchResponse.body) {
    const reader = fetchResponse.body.getReader()
    const pump = async (): Promise<void> => {
      const { done, value } = await reader.read()
      if (done) {
        res.end()
        return
      }
      res.write(value)
      return pump()
    }
    await pump()
  }
  else {
    res.end()
  }
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  try {
    console.log(`${req.method} ${req.url}`)

    // Handle body parsing for non-GET requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const chunks: Buffer[] = []
      req.on('data', chunk => chunks.push(chunk))
      await new Promise<void>((resolve) => {
        req.on('end', () => resolve())
      })

      const body = Buffer.concat(chunks).toString()
      const protocol = 'http'
      const host = req.headers.host || `localhost:${PORT}`
      const url = `${protocol}://${host}${req.url}`

      const headers = new Headers()
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) {
          if (Array.isArray(value)) {
            value.forEach(v => headers.append(key, v))
          }
          else {
            headers.append(key, value)
          }
        }
      })

      const fetchRequest = new Request(url, {
        method: req.method,
        headers,
        body: body || undefined,
      })

      const fetchResponse = await handleRequest(fetchRequest)
      await sendFetchResponse(res, fetchResponse)
    }
    else {
      const fetchRequest = createFetchRequest(req)
      const fetchResponse = await handleRequest(fetchRequest)
      await sendFetchResponse(res, fetchResponse)
    }
  }
  catch (error) {
    console.error('Server error:', error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ status: 'error', message: 'Internal Server Error' }))
  }
})

server.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server running at http://${HOST}:${PORT}/`)
  console.log(`📊 DX-Rating API Server`)
  console.log(`\nAvailable endpoints:`)
  console.log(`  - GET  /`)
  console.log(`  - GET  /api/getRating/:friendCode`)
  console.log(`  - GET  /api/genImage/:friendCode`)
  console.log(`  - GET  /api/luoxue/getRating/:friendCode`)
  console.log(`  - GET  /api/luoxue/genImage/:friendCode`)
  console.log(`\nPress Ctrl+C to stop`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received, shutting down gracefully...')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})
