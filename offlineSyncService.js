import { withStore, SYNC_QUEUE_STORE } from '../db/index.js'

const SYNC_LISTENERS = new Set()

export function onSyncStatusChange(listener) {
  SYNC_LISTENERS.add(listener)
  return () => SYNC_LISTENERS.delete(listener)
}

function notifySyncListeners(status) {
  SYNC_LISTENERS.forEach((listener) => {
    try {
      listener(status)
    } catch (error) {
      console.error('Sync listener error', error)
    }
  })
}

/**
 * Queue an action for syncing when online
 */
export async function queueAction(action, data) {
  return withStore(SYNC_QUEUE_STORE, 'readwrite', async (store) => {
    const record = {
      action,
      data,
      status: 'pending',
      timestamp: Date.now(),
      attempts: 0,
    }
    const id = await store.add(record)
    notifySyncListeners({ type: 'queued', action, id })
    return id
  })
}

/**
 * Get all pending sync actions
 */
export async function getPendingActions() {
  return withStore(SYNC_QUEUE_STORE, 'readonly', async (store) => {
    const index = store.index('by-status')
    const range = IDBKeyRange.only('pending')
    const actions = []

    for await (const cursor of index.iterate(range)) {
      actions.push(cursor.value)
    }

    return actions.sort((a, b) => a.timestamp - b.timestamp)
  })
}

/**
 * Mark a sync action as completed
 */
export async function markActionSynced(actionId) {
  return withStore(SYNC_QUEUE_STORE, 'readwrite', async (store) => {
    const record = await store.get(actionId)
    if (!record) return

    record.status = 'synced'
    record.syncedAt = Date.now()
    await store.put(record)
    notifySyncListeners({ type: 'synced', id: actionId })
  })
}

/**
 * Mark a sync action as failed
 */
export async function markActionFailed(actionId, error) {
  return withStore(SYNC_QUEUE_STORE, 'readwrite', async (store) => {
    const record = await store.get(actionId)
    if (!record) return

    record.status = 'failed'
    record.attempts += 1
    record.lastError = error?.message || 'Unknown error'
    record.lastAttempt = Date.now()
    await store.put(record)
    notifySyncListeners({ type: 'failed', id: actionId, error })
  })
}

/**
 * Clear synced actions (cleanup)
 */
export async function clearSyncedActions() {
  return withStore(SYNC_QUEUE_STORE, 'readwrite', async (store) => {
    const index = store.index('by-status')
    const range = IDBKeyRange.only('synced')

    for await (const cursor of index.iterate(range)) {
      await cursor.delete()
    }
  })
}

/**
 * Get sync status
 */
export async function getSyncStatus() {
  return withStore(SYNC_QUEUE_STORE, 'readonly', async (store) => {
    const all = await store.getAll()
    const pending = all.filter((a) => a.status === 'pending')
    const synced = all.filter((a) => a.status === 'synced')
    const failed = all.filter((a) => a.status === 'failed')

    return {
      pending: pending.length,
      synced: synced.length,
      failed: failed.length,
      total: all.length,
      lastSync: synced.length > 0 ? Math.max(...synced.map((a) => a.syncedAt || 0)) : null,
    }
  })
}

/**
 * Initialize online/offline listeners for PWA background sync
 */
export function initializeOfflineSync() {
  if (typeof window === 'undefined') return

  function handleOnline() {
    notifySyncListeners({ type: 'online' })
    console.info('App is online. Sync will occur in background.')
  }

  function handleOffline() {
    notifySyncListeners({ type: 'offline' })
    console.info('App is offline. Changes will be queued for sync.')
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Check initial state
  if (navigator.onLine) {
    handleOnline()
  } else {
    handleOffline()
  }

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Check if app is currently online
 */
export function isOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}
