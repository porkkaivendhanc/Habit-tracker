import { useMemo, useState } from 'react'
import { Plus, ArrowLeft } from 'lucide-react'
import HabitCard from './components/HabitCard.jsx'
import HabitFormModal from './components/HabitFormModal.jsx'
import AnalyticsDashboard from './components/AnalyticsDashboard.jsx'
import YearlyOverview from './components/YearlyOverview.jsx'
import HabitAnalyticsPage from './components/HabitAnalyticsPage.jsx'
import OfflineStatus from './components/OfflineStatus.jsx'
import ThemeToggle from './components/ThemeToggle.jsx'
import Homepage from './components/Homepage.jsx'
import DeleteConfirmModal from './components/DeleteConfirmModal.jsx'
import useHabits from './hooks/useHabits.js'
import useStreaks from './hooks/useStreaks.js'
import ClickSpark from './components/ClickSpark.jsx'
import DotGrid from './components/DotGrid.jsx'
import { useTheme } from './contexts/useTheme.js'

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:shadow-lg dark:hover:shadow-blue-950/30">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-slate-100">{value}</p>
      {accent ? <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{accent}</p> : null}
    </div>
  )
}

export default function App() {
  const { theme } = useTheme()
  const [showHome, setShowHome] = useState(true)
  const [selectedHabitForAnalytics, setSelectedHabitForAnalytics] = useState(null)
  const {
    habits,
    loading,
    error,
    addHabit,
    editHabit,
    removeHabit,
    checkInToday,
    getSummary,
  } = useHabits()
  const streakStats = useStreaks(habits)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [feedback, setFeedback] = useState('')
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, habitId: null, habitName: '' })
  const activeHabits = useMemo(() => habits.filter((habit) => habit.streak?.currentStreak > 0), [habits])

  if (showHome) {
    return <Homepage onGetStarted={() => setShowHome(false)} />
  }

  if (selectedHabitForAnalytics) {
    return (
      <HabitAnalyticsPage
        habit={selectedHabitForAnalytics}
        onBack={() => setSelectedHabitForAnalytics(null)}
      />
    )
  }

  async function handleAddHabit(values) {
    try {
      await addHabit(values)
      setFeedback('Habit added successfully.')
      setShowAddModal(false)
    } catch (err) {
      console.error(err)
      setFeedback('Could not add habit. Please try again.')
    }
  }

  async function handleUpdateHabit(values) {
    if (!editingHabit) return
    try {
      await editHabit(editingHabit.id, values)
      setFeedback('Habit updated.')
      setEditingHabit(null)
    } catch (err) {
      console.error(err)
      setFeedback('Update failed. Please try again.')
    }
  }

  async function handleDeleteHabit(id, name) {
    setDeleteModal({ isOpen: true, habitId: id, habitName: name })
  }

  async function confirmDelete() {
    try {
      await removeHabit(deleteModal.habitId)
      setFeedback('Habit removed.')
      setDeleteModal({ isOpen: false, habitId: null, habitName: '' })
    } catch (err) {
      console.error(err)
      setFeedback('Something went wrong deleting the habit.')
    }
  }

  async function handleCheckIn(habitId) {
    try {
      await checkInToday(habitId)
    } catch (err) {
      console.error(err)
      setFeedback('Unable to update today’s check-in.')
    }
  }

  async function handleReminderChange(habitId, reminderTime) {
    try {
      await editHabit(habitId, { reminderTime })
      setFeedback(reminderTime ? 'Reminder saved.' : 'Reminder cleared.')
    } catch (err) {
      console.error(err)
      setFeedback('Failed to update reminder.')
    }
  }

  return (
    <div className="relative w-full min-h-screen">
      {/* Dot Grid Background */}
      <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
        <DotGrid
          dotSize={10}
          gap={15}
          baseColor={theme === 'dark' ? '#5227FF' : '#93c5fd'}
          activeColor={theme === 'dark' ? '#8b5cf6' : '#3b82f6'}
          proximity={120}
          shockRadius={250}
          shockStrength={5}
          resistance={750}
          returnDuration={1.5}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen bg-gradient-to-br from-slate-50/90 via-white/90 to-slate-100/90 text-gray-900 dark:from-slate-950/90 dark:via-slate-900/90 dark:to-slate-950/90 dark:text-slate-100">
        <ClickSpark
          sparkColor={theme === 'dark' ? '#ffffff' : '#000000'}
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
          <div className="px-4 py-10">
          {/* Homepage Button - Fixed Top Left */}
          <button
            onClick={() => setShowHome(true)}
            className="fixed inline-flex items-center top-2 sm:top-4 left-2 sm:left-4 z-40 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <main className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-8">
            <header className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-50 truncate">
                  Habit Tracker
                </h1>
                <ThemeToggle />
              </div>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Track daily habits, see your streaks, and stay motivated with reminders.
              </p>
              <OfflineStatus />
              {feedback ? <p className="text-xs text-blue-500">{feedback}</p> : null}
              {error ? <p className="text-xs text-red-500">{error.message}</p> : null}
            </header>

            <section className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              <StatCard label="Total habits" value={streakStats.totalHabits} />
              <StatCard
                label="Active streaks"
                value={streakStats.activeHabits}
                accent={
                  activeHabits.length
                    ? `Currently active: ${activeHabits.map((habit) => habit.name).join(', ')}`
                    : 'No active streaks yet.'
                }
              />
              <StatCard
                label="Longest streak"
                value={`${streakStats.longestStreak} day${streakStats.longestStreak === 1 ? '' : 's'}`}
              />
            </section>

            <section className="grid gap-6">
              {/* Top Streaks Card */}
              <div className="rounded-xl border border-gray-200 bg-orange-50/20 p-6 shadow-sm transition-all duration-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                  Top streaks
                </h2>
                {streakStats.topHabits.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                    Keep checking in every day to build streaks.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {streakStats.topHabits.map((item) => (
                      <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm dark:bg-slate-800/70 transition-colors hover:bg-gray-100 dark:hover:bg-slate-700/70"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-500 dark:text-slate-300">
                          {item.current} day{item.current === 1 ? '' : 's'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Today's Habits Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
                    Today&apos;s habits
                  </h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Habit
                  </button>
                </div>
                {loading ? (
                  <p className="text-sm text-gray-500">Loading habits…</p>
                ) : habits.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No habits yet. Add your first habit to get started!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <HabitCard
                      key={habit.id}
                      habit={habit}
                      onCheckIn={handleCheckIn}
                      onEdit={setEditingHabit}
                      onDelete={(id) => handleDeleteHabit(id, habit.name)}
                      loadSummary={(id) => getSummary(id, 14)}
                      onReminderChange={handleReminderChange}
                      onMockReminder={() => setFeedback('Mock reminder sent.')}
                      onViewAnalytics={setSelectedHabitForAnalytics}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-4">
              <AnalyticsDashboard habits={habits} />
            </section>

            <HabitFormModal
              isOpen={showAddModal}
              onClose={() => setShowAddModal(false)}
              onSubmit={handleAddHabit}
              title="Add a new habit"
              submitLabel="Add habit"
            />

            <HabitFormModal
              isOpen={!!editingHabit && !!editingHabit.id}
              onClose={() => setEditingHabit(null)}
              onSubmit={handleUpdateHabit}
              initialHabit={editingHabit}
              title="Edit habit"
              submitLabel="Update habit"
              />

            <DeleteConfirmModal 
              isOpen={deleteModal.isOpen}
              onClose={() => setDeleteModal({ isOpen: false, habitId: null, habitName: '' })}
              onConfirm={confirmDelete}
              habitName={deleteModal.habitName}
              />
          </main>
            </div>
        </ClickSpark>
      </div>
    </div>
  )
}