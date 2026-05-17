import { format, parseISO, startOfDay, subDays, isWithinInterval } from 'date-fns'
import { withStore, ANALYTICS_STORE, CHECKINS_STORE, HABITS_STORE } from '../db/index.js'

const DATE_FORMAT = 'yyyy-MM-dd'

/**
 * Calculate completion rate for a habit over a date range
 */
export async function calculateCompletionRate(habitId, days = 30) {
  return withStore(CHECKINS_STORE, 'readonly', async (store) => {
    const index = store.index('by-habit')
    const range = IDBKeyRange.only(habitId)
    const checkins = []

    for await (const cursor of index.iterate(range)) {
      checkins.push(cursor.value)
    }

    const end = startOfDay(new Date())
    const start = startOfDay(subDays(end, days - 1))

    const checkedInDays = new Set()
    checkins.forEach((checkin) => {
      if (
        checkin.completed &&
        isWithinInterval(parseISO(checkin.date), { start, end })
      ) {
        checkedInDays.add(checkin.date)
      }
    })

    const completionRate = days > 0 ? (checkedInDays.size / days) * 100 : 0
    return {
      completionRate: parseFloat(completionRate.toFixed(2)),
      completedDays: checkedInDays.size,
      totalDays: days,
    }
  })
}

/**
 * Get trend data for a habit - completion counts by week/month
 */
export async function getHabitTrends(habitId, weeks = 12) {
  return withStore(CHECKINS_STORE, 'readonly', async (store) => {
    const index = store.index('by-habit')
    const range = IDBKeyRange.only(habitId)
    const checkins = []

    for await (const cursor of index.iterate(range)) {
      checkins.push(cursor.value)
    }

    const trends = {}
    const end = new Date()

    for (let i = 0; i < weeks; i += 1) {
      const weekStart = startOfDay(subDays(end, i * 7 + 7))
      const weekEnd = startOfDay(subDays(end, i * 7))
      const weekKey = format(weekEnd, 'yyyy-MM')

      const weekCheckins = checkins.filter((checkin) => {
        const date = parseISO(checkin.date)
        return (
          checkin.completed &&
          isWithinInterval(date, { start: weekStart, end: weekEnd })
        )
      })

      trends[weekKey] = weekCheckins.length
    }

    return Object.entries(trends)
      .reverse()
      .map(([period, count]) => ({
        period,
        completions: count,
      }))
  })
}

/**
 * Get comprehensive stats for a habit
 */
export async function getHabitStats(habitId) {
  return withStore(CHECKINS_STORE, 'readonly', async (store) => {
    const index = store.index('by-habit')
    const range = IDBKeyRange.only(habitId)
    const checkins = []

    for await (const cursor of index.iterate(range)) {
      checkins.push(cursor.value)
    }

    const completed = checkins.filter((c) => c.completed)
    const lastWeek = completed.filter((c) => {
      const date = parseISO(c.date)
      return isWithinInterval(date, {
        start: startOfDay(subDays(new Date(), 7)),
        end: new Date(),
      })
    }).length

    const lastMonth = completed.filter((c) => {
      const date = parseISO(c.date)
      return isWithinInterval(date, {
        start: startOfDay(subDays(new Date(), 30)),
        end: new Date(),
      })
    }).length

    const completionRate30 = await calculateCompletionRate(habitId, 30)
    const completionRate90 = await calculateCompletionRate(habitId, 90)

    return {
      totalCompletions: completed.length,
      lastWeekCompletions: lastWeek,
      lastMonthCompletions: lastMonth,
      completionRate30: completionRate30.completionRate,
      completionRate90: completionRate90.completionRate,
      consistency: {
        excellent: completionRate30.completionRate >= 90,
        good: completionRate30.completionRate >= 70,
        fair: completionRate30.completionRate >= 50,
      },
    }
  })
}

/**
 * Get all habits statistics overview
 */
export async function getAllHabitsStats() {
  return withStore(HABITS_STORE, 'readonly', async (habitsStore) => {
    const habits = await habitsStore.getAll()
    const stats = {}

    for (const habit of habits) {
      stats[habit.id] = await getHabitStats(habit.id)
    }

    return stats
  })
}

/**
 * Get combined analytics across all habits
 */
export async function getGlobalAnalytics() {
  return withStore(HABITS_STORE, 'readonly', async (habitsStore) => {
    const habits = await habitsStore.getAll()
    const stats = await getAllHabitsStats()

    const totalCompletions = Object.values(stats).reduce(
      (sum, s) => sum + s.totalCompletions,
      0,
    )
    const totalHabits = habits.length
    const activeHabits = habits.filter((h) => stats[h.id]?.totalCompletions > 0)
      .length

    const avgCompletionRate =
      totalHabits > 0
        ? parseFloat(
            (
              Object.values(stats).reduce((sum, s) => sum + s.completionRate30, 0) /
              totalHabits
            ).toFixed(2),
          )
        : 0

    // Add habit names to stats
    const habitStatsWithNames = {}
    for (const habit of habits) {
      habitStatsWithNames[habit.id] = {
        ...stats[habit.id],
        habitName: habit.name,
      }
    }

    return {
      totalHabits,
      activeHabits,
      totalCompletions,
      averageCompletionRate: avgCompletionRate,
      habitStats: habitStatsWithNames,
    }
  })
}

/**
 * Record analytics event
 */
export async function recordAnalyticsEvent(event) {
  return withStore(ANALYTICS_STORE, 'readwrite', async (store) => {
    const record = {
      ...event,
      date: event.date || format(new Date(), DATE_FORMAT),
      timestamp: new Date().toISOString(),
    }
    await store.add(record)
    return record
  })
}

/**
 * Get analytics events for a habit in a date range
 */
export async function getAnalyticsEvents(habitId, startDate, endDate) {
  return withStore(ANALYTICS_STORE, 'readonly', async (store) => {
    const index = store.index('by-habit')
    const range = IDBKeyRange.only(habitId)
    const events = []

    for await (const cursor of index.iterate(range)) {
      const event = cursor.value
      if (event.date >= format(startDate, DATE_FORMAT) && event.date <= format(endDate, DATE_FORMAT)) {
        events.push(event)
      }
    }

    return events.sort((a, b) => (a.date > b.date ? 1 : -1))
  })
}
