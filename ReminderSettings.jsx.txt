import { useEffect, useMemo, useState } from 'react'
import {
  clearReminder,
  requestNotificationPermission,
  scheduleReminder,
  triggerMockReminder,
} from '../services/notificationService.js'

function getNextTriggerFromTime(time) {
  if (!time) {
    return null
  }
  const [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null
  }
  const now = new Date()
  const trigger = new Date()
  trigger.setHours(hours, minutes, 0, 0)
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1)
  }
  return trigger
}

function getPermission() {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }
  return Notification.permission
}

export default function ReminderSettings({ habit, onReminderChange, onMockReminder }) {
  const [time, setTime] = useState(habit.reminderTime ?? '')
  const [status, setStatus] = useState('')
  const [permission, setPermission] = useState(getPermission())

  useEffect(() => {
    setTime(habit.reminderTime ?? '')
  }, [habit.reminderTime])

  const isNotificationsSupported = useMemo(() => permission !== 'unsupported', [permission])

  async function handleSaveReminder() {
    try {
      if (time) {
        const perm = await requestNotificationPermission()
        setPermission(perm)
      }

      await onReminderChange?.(habit.id, time || null)

      if (time) {
        const triggerAt = getNextTriggerFromTime(time)
        if (triggerAt) {
          await scheduleReminder({
            habitId: habit.id,
            title: `Reminder: ${habit.name}`,
            body: 'Time to check in on your habit!',
            triggerAt,
          })
        }
        setStatus('Reminder saved and scheduled.')
      } else {
        clearReminder(habit.id)
        setStatus('Reminder removed.')
      }
    } catch (error) {
      console.error('Failed to configure reminder', error)
      setStatus('Something went wrong saving your reminder.')
    }
  }

  function handleMockReminder() {
    triggerMockReminder(habit)
    onMockReminder?.(habit)
  }

  return (
    <div className="space-y-3">
      <header>
        <h5 className="text-sm font-semibold" style={{ color: habit.color }}>Reminder</h5>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Configure daily notifications and in-app reminders.
        </p>
      </header>

      <div className="flex items-center gap-3">
        <input
          type="time"
          value={time ?? ''}
          onChange={(event) => setTime(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-gray-800 text-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={handleSaveReminder}
          className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 transition-colors"
        >
          Save
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleMockReminder}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Send mock notification
        </button>
        {time ? (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            Next reminder around {time}
          </span>
        ) : (
          <span className="text-xs text-gray-400">No reminder scheduled</span>
        )}
      </div>

      {status ? <p className="text-xs text-blue-500">{status}</p> : null}

      {!isNotificationsSupported ? (
        <p className="text-xs text-amber-500">
          Browser notifications are not supported here. In-app reminders still work.
        </p>
      ) : permission !== 'granted' ? (
        <p className="text-xs text-gray-500">
          Notifications {permission === 'denied' ? 'blocked' : 'pending approval'}. {permission === 'denied' ? 'Please enable them in your browser settings.' : ''}
        </p>
      ) : null}
    </div>
  )
}


