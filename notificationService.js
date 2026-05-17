const inAppListeners = new Set()
const reminderTimers = new Map()

function isNotificationAPISupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

function isServiceWorkerSupported() {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator
}

export function requestNotificationPermission() {
  if (!isNotificationAPISupported()) {
    return Promise.resolve('denied')
  }

  if (Notification.permission !== 'default') {
    return Promise.resolve(Notification.permission)
  }

  return Notification.requestPermission()
}

/**
 * Subscribe to the push notification service
 * (Requires a push service endpoint - this is for PWA setup)
 */
export async function subscribeToPushNotifications() {
  if (!isServiceWorkerSupported()) {
    console.warn('Service Workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: undefined, // In production, add your VAPID public key
    })
    return subscription
  } catch (error) {
    console.warn('Push subscription failed', error)
    return null
  }
}

export function subscribeInAppReminders(listener) {
  inAppListeners.add(listener)
  return () => inAppListeners.delete(listener)
}

function emitInAppReminder(payload) {
  inAppListeners.forEach((listener) => {
    try {
      listener(payload)
    } catch (error) {
      console.error('In-app reminder listener failed', error)
    }
  })
}

function showBrowserNotification({ title, body, tag = 'habit-reminder' }) {
  if (!isNotificationAPISupported() || Notification.permission !== 'granted') {
    return
  }

  try {
    new Notification(title, {
      body,
      tag,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false,
    })
  } catch (error) {
    console.error('Failed to display notification', error)
  }
}

export async function scheduleReminder({ habitId, title, body, triggerAt }) {
  const triggerTime = typeof triggerAt === 'string' ? new Date(triggerAt) : triggerAt
  if (!(triggerTime instanceof Date) || Number.isNaN(triggerTime.getTime())) {
    throw new Error('Invalid triggerAt provided for reminder')
  }

  clearReminder(habitId)

  const delay = triggerTime.getTime() - Date.now()

  const timerId = setTimeout(async () => {
    emitInAppReminder({ habitId, title, body, triggerAt: triggerTime.toISOString() })

    if (await requestNotificationPermission() === 'granted') {
      showBrowserNotification({ title, body })
    }

    reminderTimers.delete(habitId)
  }, Math.max(delay, 0))

  reminderTimers.set(habitId, timerId)
}

export function clearReminder(habitId) {
  const timerId = reminderTimers.get(habitId)
  if (timerId) {
    clearTimeout(timerId)
    reminderTimers.delete(habitId)
  }
}

export function clearAllReminders() {
  reminderTimers.forEach((timerId) => clearTimeout(timerId))
  reminderTimers.clear()
}

export function triggerMockReminder(habit) {
  const payload = {
    habitId: habit.id,
    title: `Reminder: ${habit.name}`,
    body: 'Time to check in on your habit!',
    triggerAt: new Date().toISOString(),
  }

  // Always emit in-app reminder
  emitInAppReminder(payload)
  
  // Try to show browser notification if permission granted
  if (isNotificationAPISupported() && Notification.permission === 'granted') {
    showBrowserNotification(payload)
  }
}


