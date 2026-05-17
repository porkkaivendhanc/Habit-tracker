import {
  differenceInCalendarDays,
  format,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns'
import { withStore, withStores, HABITS_STORE, CHECKINS_STORE } from '../db/index.js'

const DATE_FORMAT = 'yyyy-MM-dd'

function normalizeDate(date) {
  if (!date) {
    return format(new Date(), DATE_FORMAT)
  }
  if (typeof date === 'string') {
    return format(startOfDay(new Date(date)), DATE_FORMAT)
  }
  return format(startOfDay(date), DATE_FORMAT)
}

export async function logCheckin(habitId, date = new Date(), completed = true) {
  const normalizedDate = normalizeDate(date)
  return withStore(CHECKINS_STORE, 'readwrite', async (store) => {
    const index = store.index('by-habit-date')
    const existing = await index.get([habitId, normalizedDate])

    if (existing) {
      const updated = { ...existing, completed }
      await store.put(updated)
      return updated
    }

    const record = {
      habitId,
      date: normalizedDate,
      completed,
      createdAt: new Date().toISOString(),
    }
    await store.add(record)
    return record
  })
}

export async function removeCheckin(habitId, date) {
  const normalizedDate = normalizeDate(date)

  await withStore(CHECKINS_STORE, 'readwrite', async (store) => {
    const index = store.index('by-habit-date')
    const existing = await index.getKey([habitId, normalizedDate])
    if (existing !== undefined) {
      await store.delete(existing)
    }
  })
}

export async function getCheckins(habitId) {
  return withStore(CHECKINS_STORE, 'readonly', async (store) => {
    const index = store.index('by-habit')
    const range = IDBKeyRange.only(habitId)
    const records = []

    for await (const cursor of index.iterate(range)) {
      records.push(cursor.value)
    }

    return records.sort((a, b) => (a.date < b.date ? -1 : 1))
  })
}

export async function getCheckinsInRange(habitId, startDate, endDate) {
  const startKey = normalizeDate(startDate)
  const endKey = normalizeDate(endDate)

  return withStore(CHECKINS_STORE, 'readonly', async (store) => {
    const index = store.index('by-habit-date')
    const range = IDBKeyRange.bound([habitId, startKey], [habitId, endKey])
    const records = []

    for await (const cursor of index.iterate(range)) {
      records.push(cursor.value)
    }

    return records
  })
}

export async function toggleTodayCheckin(habitId) {
  const today = normalizeDate(new Date())

  return withStore(CHECKINS_STORE, 'readwrite', async (store) => {
    const index = store.index('by-habit-date')
    const key = await index.getKey([habitId, today])

    if (key !== undefined) {
      await store.delete(key)
      return null
    }

    const record = {
      habitId,
      date: today,
      completed: true,
      createdAt: new Date().toISOString(),
    }
    await store.add(record)
    return record
  })
}

export async function getStreakStats(habitId) {
  const checkins = await getCheckins(habitId)
  return calculateStreaks(checkins)
}

export async function getAllHabitsWithStats() {
  return withStores([HABITS_STORE, CHECKINS_STORE], 'readonly', async (habitStore, checkinStore) => {
    const habits = await habitStore.getAll()
    const stats = []

    for (const habit of habits) {
      const index = checkinStore.index('by-habit')
      const range = IDBKeyRange.only(habit.id)
      const checkins = []

      for await (const cursor of index.iterate(range)) {
        checkins.push(cursor.value)
      }

      stats.push({
        ...habit,
        streak: calculateStreaks(checkins),
      })
    }

    return stats
  })
}

export function calculateStreaks(checkins) {
  if (!Array.isArray(checkins) || checkins.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckinDate: null,
    }
  }

  const sorted = [...checkins]
    .filter((entry) => entry.completed)
    .map((entry) => ({
      ...entry,
      date: typeof entry.date === 'string' ? entry.date : normalizeDate(entry.date),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1))

  if (sorted.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCheckinDate: null,
    }
  }

  const uniqueDates = Array.from(new Set(sorted.map((entry) => entry.date)))

  let longestStreak = 1
  let run = 1

  for (let i = 1; i < uniqueDates.length; i += 1) {
    const prev = startOfDay(parseISO(uniqueDates[i - 1]))
    const current = startOfDay(parseISO(uniqueDates[i]))
    const diff = differenceInCalendarDays(current, prev)

    if (diff === 0) {
      continue
    }

    if (diff === 1) {
      run += 1
    } else {
      longestStreak = Math.max(longestStreak, run)
      run = 1
    }

    longestStreak = Math.max(longestStreak, run)
  }

  const today = startOfDay(new Date())
  let currentStreak = 0
  let prevDay = today

  for (let i = uniqueDates.length - 1; i >= 0; i -= 1) {
    const day = startOfDay(parseISO(uniqueDates[i]))
    const diff = differenceInCalendarDays(prevDay, day)

    if (currentStreak === 0) {
      if (diff === 0 || diff === 1) {
        currentStreak = 1
        prevDay = day
        continue
      }
      break
    }

    if (diff === 0) {
      prevDay = day
      continue
    }

    if (diff === 1) {
      currentStreak += 1
      prevDay = day
      continue
    }

    if (diff > 1) {
      break
    }
  }

  return {
    currentStreak,
    longestStreak,
    lastCheckinDate: sorted[sorted.length - 1].date,
  }
}

export async function getCompletionSummary(habitId, days = 30) {
  const end = startOfDay(new Date())
  const start = startOfDay(new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000))
  const checkins = await getCheckinsInRange(habitId, start, end)

  const summary = []

  for (let i = 0; i < days; i += 1) {
    const date = startOfDay(new Date(start.getTime() + i * 24 * 60 * 60 * 1000))
    const entry = checkins.find((checkin) => isSameDay(parseISO(checkin.date), date))
    summary.push({
      date: format(date, DATE_FORMAT),
      completed: entry ? entry.completed : false,
    })
  }

  return summary
}


