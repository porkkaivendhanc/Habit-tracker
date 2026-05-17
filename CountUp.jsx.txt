import { useEffect, useRef, useState } from 'react'

export default function CountUp({ end = 0, start = 0, duration = 800, decimals = 0, className = '', suffix = '' }) {
  const [value, setValue] = useState(start)
  const rafRef = useRef(null)
  const startRef = useRef(null)

  useEffect(() => {
    const startTime = performance.now()
    startRef.current = startTime

    const from = Number(start) || 0
    const to = Number(end) || 0
    const diff = to - from

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

    const step = (now) => {
      const elapsed = now - startRef.current
      const t = Math.min(1, elapsed / Math.max(1, duration))
      const progress = easeOutCubic(t)
      const current = from + diff * progress
      setValue(current)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [end, start, duration])

  const display = decimals > 0 ? value.toFixed(decimals) : Math.round(value)

  return (
    <span className={className}>{display}{suffix}</span>
  )
}
