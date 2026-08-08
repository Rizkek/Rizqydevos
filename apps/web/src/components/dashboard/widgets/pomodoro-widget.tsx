'use client'

import * as React from 'react'
import { WidgetCard } from '../widget-card'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = React.useState(25 * 60)
  const [isActive, setIsActive] = React.useState(false)

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    } else if (timeLeft === 0) {
      setIsActive(false)
      // Play sound or notification here
    }
    return () => clearInterval(interval)
  }, [isActive, timeLeft])

  const toggle = () => setIsActive(!isActive)
  const reset = () => {
    setIsActive(false)
    setTimeLeft(25 * 60)
  }

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0')
  const secs = (timeLeft % 60).toString().padStart(2, '0')
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100

  return (
    <WidgetCard
      id="w-pomodoro"
      type="pomodoro"
      title="Focus Timer"
      contentClassName="p-6 flex flex-col items-center justify-center relative"
    >
      {/* Progress ring background */}
      <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
        <circle 
          cx="50" cy="50" r="40" 
          fill="none" 
          stroke="var(--color-surface-2)" 
          strokeWidth="2" 
        />
        <circle 
          cx="50" cy="50" r="40" 
          fill="none" 
          stroke="var(--color-accent)" 
          strokeWidth="2"
          strokeDasharray="251.2"
          strokeDashoffset={251.2 - (251.2 * progress) / 100}
          className="transition-all duration-1000 linear"
        />
      </svg>

      <div className="text-5xl font-bold font-mono tracking-tighter text-[var(--color-text)] relative z-10 drop-shadow-md">
        {mins}:{secs}
      </div>
      <div className="text-[11px] font-medium uppercase tracking-widest text-[var(--color-text-muted)] mt-2 mb-6 relative z-10">
        {isActive ? 'Focusing' : 'Ready'}
      </div>

      <div className="flex items-center gap-3 relative z-10">
        <Button variant={isActive ? "secondary" : "default"} size="icon" className="w-10 h-10 rounded-full" onClick={toggle}>
          {isActive ? <Pause size={18} /> : <Play size={18} className="ml-1" />}
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text)]" onClick={reset}>
          <RotateCcw size={14} />
        </Button>
      </div>
    </WidgetCard>
  )
}
