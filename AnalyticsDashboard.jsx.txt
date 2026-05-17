import { useEffect, useState, useMemo, memo } from 'react'
import {
  getGlobalAnalytics,
} from '../services/analyticsService.js'
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from 'date-fns'
import { getCheckins } from '../services/streakService.js'
import { Check, X, AlertTriangle } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const MonthCalendar = memo(function MonthCalendar({ monthDate, checkinMap }) {
  const monthStart = startOfMonth(monthDate)
  const monthEnd = endOfMonth(monthDate)
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const now = new Date()
  
  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const monthName = format(monthDate, 'MMM')
  const year = format(monthDate, 'yyyy')
  
  const firstDayOfWeek = getDay(allDays[0])
  const emptyCells = Array(firstDayOfWeek).fill(null)
  
  const calendarDays = useMemo(() => allDays.map(day => ({
    date: day,
    dateKey: format(day, 'yyyy-MM-dd'),
    dayOfMonth: format(day, 'd'),
    completed: checkinMap.has(format(day, 'yyyy-MM-dd')),
    isToday: format(day, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd'),
  })), [allDays, checkinMap, now])

  return (
    <div className="flex-shrink-0">
      <div className="text-center mb-2">
        <h4 className="text-xs font-semibold text-gray-600 dark:text-slate-400">{monthName}</h4>
        <p className="text-[10px] text-gray-400 dark:text-slate-500">{year}</p>
      </div>
      
      {/* Weekday headers - abbreviated to single letter */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {weekDayLabels.map(day => (
          <div key={day} className="text-center text-[9px] text-gray-400 dark:text-slate-500 w-6">
            {day.charAt(0)}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {emptyCells.map((_, idx) => (
          <div key={`empty-${idx}`} className="w-6 h-6"></div>
        ))}
        {calendarDays.map((day) => (
          <div
            key={day.dateKey}
            className="group relative"
          >
            <div
              className={`w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-medium transition-all ${
                day.isToday
                  ? 'ring-1 ring-blue-500'
                  : ''
              } ${
                day.completed
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-slate-700 text-gray-400 dark:text-slate-500'
              }`}
            >
              {day.dayOfMonth}
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block z-10">
              <div className="bg-gray-900 dark:bg-slate-700 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap flex items-center gap-1">
                {format(day.date, 'MMM d')}: {day.completed ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

const HabitCalendar = memo(function HabitCalendar({ habitId, habitName }) {
  const [checkinCache, setCheckinCache] = useState(new Map())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadCalendar() {
      // Check if we already have this habit's data cached
      if (checkinCache.has(habitId)) {
        return
      }

      setLoading(true)
      try {
        // Get all check-ins for this habit
        const checkins = await getCheckins(habitId)
        const map = new Map(
          checkins.map(c => [format(parseISO(c.date), 'yyyy-MM-dd'), true])
        )
        
        // Cache the result
        setCheckinCache(prev => new Map(prev).set(habitId, map))
      } catch (error) {
        console.error('Failed to load calendar data', error)
      } finally {
        setLoading(false)
      }
    }

    if (habitId) {
      loadCalendar()
    }
  }, [habitId, checkinCache])

  const currentCheckinMap = checkinCache.get(habitId) || new Map()

  const months = useMemo(() => {
    const now = new Date()
    return [
      subMonths(now, 3),
      subMonths(now, 2),
      subMonths(now, 1),
      now
    ]
  }, [])

  if (loading && !checkinCache.has(habitId)) {
    return <p className="text-sm text-gray-400 dark:text-slate-500">Loading calendar...</p>
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
        {habitName}
      </h4>
      
      <div className="flex gap-6 overflow-x-auto pb-2">
        {months.map((month, idx) => (
          <MonthCalendar 
            key={idx} 
            monthDate={month} 
            checkinMap={currentCheckinMap}
          />
        ))}
      </div>
    </div>
  )
})

function StatBox({ label, value, unit = '', accent = 'blue' }) {
  const accentClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    orange: 'text-orange-600 dark:text-orange-400',
    red: 'text-red-600 dark:text-red-400',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-gray-300 hover:-translate-y-1 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 dark:hover:shadow-lg dark:hover:shadow-slate-950/30">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${accentClasses[accent]}`}>
        {value}
        {unit && <span className="text-lg">{unit}</span>}
      </p>
    </div>
  )
}

export default function AnalyticsDashboard({ habits }) {
  const [globalStats, setGlobalStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedHabitId, setSelectedHabitId] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadAnalytics() {
      setLoading(true)
      try {
        const stats = await getGlobalAnalytics()
        if (isMounted) {
          setGlobalStats(stats)

          // Select first habit by default
          if (
            stats.habitStats &&
            Object.keys(stats.habitStats).length > 0
          ) {
            const habitId = Object.keys(stats.habitStats)[0]
            setSelectedHabitId(habitId)
          } else {
            setSelectedHabitId(null)
          }
        }
      } catch (error) {
        console.error('Failed to load analytics', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAnalytics()
    return () => {
      isMounted = false
    }
  }, [habits])

  const handleHabitSelect = (habitId) => {
    setSelectedHabitId(habitId)
  }

  if (loading) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  if (!globalStats) {
    return (
      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-gray-500">
          No analytics data available yet. Start tracking habits to see insights.
        </p>
      </div>
    )
  }

  const selectedHabitStats = selectedHabitId ? globalStats.habitStats[selectedHabitId] : null

  return (
    <div className="space-y-6">
      {/* Global Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
          Analytics Overview
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <StatBox
            label="Total Habits"
            value={globalStats.totalHabits}
            accent="blue"
          />
          <StatBox
            label="Active Habits"
            value={globalStats.activeHabits}
            accent="green"
          />
          <StatBox
            label="Total Completions"
            value={globalStats.totalCompletions}
            accent="orange"
          />
          <StatBox
            label="Avg Completion"
            value={globalStats.averageCompletionRate.toFixed(1)}
            unit="%"
            accent="blue"
          />
        </div>
      </section>

      {/* Per-Habit Analytics */}
      {Object.keys(globalStats.habitStats).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
              Habit Insights
            </h2>
          </div>

          {/* Habit Selector */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(globalStats.habitStats).map(([habitId, habitData]) => (
              <button
                key={habitId}
                onClick={() => handleHabitSelect(habitId)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedHabitId === habitId
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {habitData.habitName}
              </button>
            ))}
          </div>

          {/* Selected Habit Details */}
          {selectedHabitStats && (
            <div className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Completion Stats
                </h3>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">
                      Total Completions
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                      {selectedHabitStats.totalCompletions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">
                      Last 7 Days
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                      {selectedHabitStats.lastWeekCompletions}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-slate-400">
                      Last 30 Days
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">
                      {selectedHabitStats.lastMonthCompletions}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                  Consistency
                </h3>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-slate-400">
                        30-Day Rate
                      </span>
                      <span className="font-semibold">
                        {selectedHabitStats.completionRate30.toFixed(1)}%
                      </span>
                    </p>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                      <div
                        className={`h-full ${
                          selectedHabitStats.consistency.excellent
                            ? 'bg-green-500'
                            : selectedHabitStats.consistency.good
                              ? 'bg-blue-500'
                              : selectedHabitStats.consistency.fair
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                        }`}
                        style={{
                          width: `${selectedHabitStats.completionRate30}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
                    {selectedHabitStats.consistency.excellent && <><Check className="w-3 h-3 text-green-500" /> Excellent consistency</>}
                    {selectedHabitStats.consistency.good &&
                      !selectedHabitStats.consistency.excellent &&
                      <><Check className="w-3 h-3 text-blue-500" /> Good consistency</>}
                    {selectedHabitStats.consistency.fair &&
                      !selectedHabitStats.consistency.good &&
                      <><AlertTriangle className="w-3 h-3 text-yellow-500" /> Fair consistency</>}
                    {!selectedHabitStats.consistency.fair && <><X className="w-3 h-3 text-red-500" /> Needs improvement</>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Calendar for Selected Habit */}
          {selectedHabitId && selectedHabitStats && (
            <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <HabitCalendar 
                habitId={selectedHabitId} 
                habitName={selectedHabitStats.habitName}
              />
            </div>
          )}
        </section>
      )}
    </div>
  )
}
