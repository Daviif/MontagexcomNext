import axios from 'axios'
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
  Method,
} from 'axios'

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      cacheKey?: string
    }
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL

const CACHE_PREFIX = "@Montagex:api-cache:"
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 min
const OFFLINE_QUEUE_KEY = '@Montagex:offline-queue'
const OFFLINE_QUEUE_EVENT = 'montagex:offline-queue-updated'

let isSyncingOfflineQueue = false
let lastOfflineSyncAt: number | null = null
let lastOfflineSyncError: string | null = null

type ApiOfflineError = Error & {
  code?: string
  isOffline?: boolean
}

type OfflineQueueItem = {
  id: string
  method: string
  url?: string
  baseURL?: string
  data?: unknown
  params?: unknown
  headers: Record<string, string>
  createdAt: number
  retries: number
}

const isDev = process.env.NODE_ENV !== 'production'

const getDefaultApiBaseUrl = () => {
  if (isDev) {
    if (!API_URL || API_URL.includes('.app.github.dev')) {
      return '/api'
    }

    return API_URL
  }

  if (API_URL) {
    return API_URL
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const codespacesMatch = hostname.match(/^(.*)-\d+\.app\.github\.dev$/)

    if (codespacesMatch?.[1]) {
      return `${protocol}//${codespacesMatch[1]}-3000.app.github.dev/api`
    }
  }

  return 'http://localhost:3000/api'
}

const getDefaultWsUrl = () => {
  if (isDev && typeof window !== 'undefined') {
    if (!WS_URL || WS_URL.includes('.app.github.dev')) {
      return window.location.origin
    }

    return WS_URL
  }

  if (WS_URL) {
    return WS_URL
  }

  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location
    const codespacesMatch = hostname.match(/^(.*)-\d+\.app\.github\.dev$/)

    if (codespacesMatch?.[1]) {
      return `${protocol}//${codespacesMatch[1]}-3000.app.github.dev`
    }
  }

  return 'http://localhost:3000'
}

export const api = axios.create({
    baseURL: getDefaultApiBaseUrl(),
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

const rawApi = axios.create({
  baseURL: getDefaultApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const wsBaseURL = getDefaultWsUrl()

const getCacheKey = (config: InternalAxiosRequestConfig) => {
  const method = (config.method || "get").toLowerCase()
  const url = `${config.baseURL || ""}${config.url || ""}`
  const params = config.params ? JSON.stringify(config.params) : ""

  return `${CACHE_PREFIX}${method}:${url}?${params}`
}

const readCachedResponse = (cacheKey: string) => {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem(cacheKey)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)

    if (!parsed?.cachedAt || Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return parsed.data
  } catch {
    localStorage.removeItem(cacheKey)
    return null
  }
}

const writeCachedResponse = (cacheKey: string, data: unknown) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        cachedAt: Date.now(),
        data,
      })
    )
  } catch {
    // ignora erro de storage
  }
}

const buildCachedAxiosResponse = (
  config: InternalAxiosRequestConfig,
  data: unknown,
  cacheState: string
): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {
    'x-montagex-cache': cacheState,
  },
  config,
  request: {
    fromCache: true,
  },
})

const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false

const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false

  const err = error as AxiosError & { isOffline?: boolean }

  if (err.response) return false

  return (
    err.code === "ECONNABORTED" ||
    err.code === "ERR_NETWORK" ||
    err.message === "Network Error" ||
    err.isOffline === true
  )
}

const loadOfflineQueue = (): OfflineQueueItem[] => {
  if (typeof localStorage === 'undefined') {
    return []
  }

  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveOfflineQueue = (queue: OfflineQueueItem[]) => {
  if (typeof localStorage === 'undefined') {
    return
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
}

const dispatchOfflineQueueUpdate = () => {
  if (typeof window === 'undefined') {
    return
  }

  const queue = loadOfflineQueue()
  window.dispatchEvent(
    new CustomEvent(OFFLINE_QUEUE_EVENT, {
      detail: {
        pending: queue.length,
        isSyncing: isSyncingOfflineQueue,
        lastSyncAt: lastOfflineSyncAt,
        lastError: lastOfflineSyncError,
      },
    })
  )
}

const enqueueOfflineMutation = (config: InternalAxiosRequestConfig): OfflineQueueItem => {
  const queue = loadOfflineQueue()

  const contentTypeHeader =
    (typeof config.headers?.get === 'function' && config.headers.get('Content-Type')) ||
    (typeof config.headers?.get === 'function' && config.headers.get('content-type'))

  const normalizedContentType =
    typeof contentTypeHeader === 'string' ? contentTypeHeader : 'application/json'

  const queueItem: OfflineQueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    method: (config.method || 'post').toLowerCase(),
    url: config.url,
    baseURL: config.baseURL,
    data: config.data,
    params: config.params,
    headers: {
      'Content-Type': normalizedContentType,
    },
    createdAt: Date.now(),
    retries: 0,
  }

  queue.push(queueItem)
  saveOfflineQueue(queue)
  dispatchOfflineQueueUpdate()
  return queueItem
}

const getAuthHeaders = (): Record<string, string> => {
  if (typeof localStorage === 'undefined') {
    return {}
  }

  const token = localStorage.getItem('@Montagex:token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const getOfflineQueueStatus = () => {
  const queue = loadOfflineQueue()
  return {
    pending: queue.length,
    isSyncing: isSyncingOfflineQueue,
    lastSyncAt: lastOfflineSyncAt,
    lastError: lastOfflineSyncError,
  }
}

const shouldDiscardOfflineQueueItem = (item: OfflineQueueItem, error: unknown): boolean => {
  const axiosError = error as AxiosError
  const status = axiosError.response?.status

  if (!status) {
    return false
  }

  // DELETE com 404 significa que o recurso já não existe mais no servidor.
  if (item.method === 'delete' && status === 404) {
    return true
  }

  // Demais erros 4xx são irrecuperáveis para retry automático.
  return status >= 400 && status < 500
}

const syncOfflineQueue = async () => {
  if (isSyncingOfflineQueue || isOffline()) {
    return
  }

  const queue = loadOfflineQueue()

  if (!queue.length) {
    lastOfflineSyncError = null
    dispatchOfflineQueueUpdate()
    return
  }

  isSyncingOfflineQueue = true
  lastOfflineSyncError = null
  dispatchOfflineQueueUpdate()

  const remaining = [...queue]
  let hasBlockingError = false

  try {
    while (remaining.length) {
      const item = remaining[0]

      try {
      await rawApi.request({
        method: item.method as Method,
        url: item.url,
        baseURL: item.baseURL || api.defaults.baseURL,
        data: item.data,
        params: item.params,
        headers: {
          ...item.headers,
          ...getAuthHeaders(),
        },
      })

      remaining.shift()
      saveOfflineQueue(remaining)
      dispatchOfflineQueueUpdate()
      } catch (error) {
        if (shouldDiscardOfflineQueueItem(item, error)) {
          remaining.shift()
          saveOfflineQueue(remaining)
          dispatchOfflineQueueUpdate()
          continue
        }

        if (remaining[0]) {
          remaining[0].retries = (remaining[0].retries || 0) + 1
          saveOfflineQueue(remaining)
        }

        const err = error as Error
        lastOfflineSyncError = err.message || 'Falha ao sincronizar fila offline.'
        hasBlockingError = true
        break
      }
    }

    if (!hasBlockingError) {
      lastOfflineSyncAt = Date.now()
      lastOfflineSyncError = null
    }
  } finally {
    isSyncingOfflineQueue = false
    dispatchOfflineQueueUpdate()
  }
}

export const isOfflineError = (error: unknown): boolean => {
  const err = error as ApiOfflineError

  return Boolean(
    err?.isOffline ||
      err?.code === 'OFFLINE_NO_CACHE' ||
      err?.code === 'OFFLINE_MUTATION_BLOCKED' ||
      err?.code === 'OFFLINE_MUTATION_QUEUED'
  )
}

export { getOfflineQueueStatus, OFFLINE_QUEUE_EVENT }

api.interceptors.request.use((config) => {
    if (typeof window === 'undefined') return config

    const token = localStorage.getItem('@Montagex:token')
    if (token) {
      ;(config.headers as Record<string, string>).Authorization = `Bearer ${token}`
    }

    const method  = (config.method || "get").toLowerCase()

    if (method !== 'get' && isOffline()) {
      enqueueOfflineMutation(config)
      const offlineMutationError: ApiOfflineError = new Error(
        'Você está offline. A operação foi salva na fila e será sincronizada automaticamente.'
      )
      offlineMutationError.code = 'OFFLINE_MUTATION_QUEUED'
      offlineMutationError.isOffline = true
      return Promise.reject(offlineMutationError)
    }

    if (method === "get") {
        const cacheKey = getCacheKey(config)

        config.metadata = { 
            ...(config.metadata || {}),
            cacheKey,
        }

        if (isOffline()) {
          const cachedData = readCachedResponse(cacheKey)

          if (cachedData !== null) {
            config.adapter = async () => buildCachedAxiosResponse(config, cachedData, 'HIT-OFFLINE')
          } else {
            const offlineNoCacheError: ApiOfflineError = new Error(
              'Você está offline e não há dados em cache para esta tela.'
            )
            offlineNoCacheError.code = 'OFFLINE_NO_CACHE'
            offlineNoCacheError.isOffline = true

            return Promise.reject(offlineNoCacheError)
          }
        }
    }

    return config    
})

api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || "get").toLowerCase()
    const cacheKey = response.config?.metadata?.cacheKey

    if (method === "get" && cacheKey) {
      writeCachedResponse(cacheKey, response.data)
    }

    return response
  },  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      localStorage.removeItem('@Montagex:token')
      localStorage.removeItem('@Montagex:user')
      window.location.href = '/login'
    }

    const method = (error.config?.method || "get").toLowerCase()
    const cacheKey =
      error.config?.metadata?.cacheKey || (error.config ? getCacheKey(error.config) : null)

    if (method !== 'get' && error.config && isNetworkError(error)) {
      enqueueOfflineMutation(error.config)

      const queuedError: ApiOfflineError = new Error(
        'Falha de conexão. A operação foi adicionada à fila offline para sincronização.'
      )
      queuedError.code = 'OFFLINE_MUTATION_QUEUED'
      queuedError.isOffline = true

      return Promise.reject(queuedError)
    }

    if (method === "get" && cacheKey && isNetworkError(error)) {
      const cachedData = readCachedResponse(cacheKey)

      if (cachedData !== null) {
        return Promise.resolve(buildCachedAxiosResponse(error.config, cachedData, 'STALE-FALLBACK'))
      }
    }

    return Promise.reject(error)
  }
)

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncOfflineQueue()
  })

  setTimeout(() => {
    dispatchOfflineQueueUpdate()
    if (!isOffline()) {
      syncOfflineQueue()
    }
  }, 0)
}

export default api
