/**
 * Environment Compatibility Layer
 * This module provides a unified interface for accessing environment variables
 * across both Cloudflare Workers and Node.js environments
 */

import type { Env } from './index.js'
import process from 'node:process'

// Check if we're running in a Cloudflare Workers environment
const isCloudflareWorkers = typeof globalThis !== 'undefined'
  && 'caches' in globalThis
  && typeof (globalThis as any).WebSocketPair !== 'undefined'

/**
 * Get environment variables in a platform-agnostic way
 * In Node.js: reads from process.env
 * In Cloudflare Workers: reads from cloudflare:workers env
 */
export function getEnv(): Env {
  if (isCloudflareWorkers) {
    // In Cloudflare Workers, this will be provided by the runtime
    // This is a placeholder that will be replaced at runtime
    return {} as Env
  }
  else {
    // In Node.js, read from process.env
    if (typeof process !== 'undefined' && process.env) {
      return {
        LUOXUE_API_KEY: process.env.LUOXUE_API_KEY,
      } as Env
    }
    throw new Error('Unable to access environment variables')
  }
}

/**
 * For Cloudflare Workers, this will be dynamically imported
 */
export async function getCloudflareEnv(): Promise<Env> {
  if (isCloudflareWorkers) {
    const { env } = await import('cloudflare:workers')
    return env as Env
  }
  return getEnv()
}
