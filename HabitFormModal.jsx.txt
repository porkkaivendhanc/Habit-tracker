import { X } from 'lucide-react'
import HabitForm from './HabitForm.jsx'

export default function HabitFormModal({ isOpen, onClose, onSubmit, initialHabit, title, submitLabel }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between p-8 pb-5 border-b border-gray-200 dark:border-slate-800">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <HabitForm
            initialHabit={initialHabit}
            submitLabel={submitLabel}
            onSubmit={(values) => {
              onSubmit(values)
              onClose()
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  )
}
