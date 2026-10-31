import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { PomodoroWidget } from './pomodoro-widget'

describe('PomodoroWidget', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('counts down while running and pauses on demand', () => {
    render(<PomodoroWidget />)
    expect(screen.getByText('25:00')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    expect(screen.getByText('Focusing')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(3_000) })
    expect(screen.getByText('24:57')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Pause timer' }))
    act(() => { vi.advanceTimersByTime(5_000) })
    expect(screen.getByText('24:57')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('stops by itself at zero and does not go negative', () => {
    render(<PomodoroWidget />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))

    act(() => { vi.advanceTimersByTime(25 * 60 * 1000 + 5_000) })

    expect(screen.getByText('00:00')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start timer' })).toBeInTheDocument()
  })

  it('reset returns to 25 minutes and stops the timer', () => {
    render(<PomodoroWidget />)
    fireEvent.click(screen.getByRole('button', { name: 'Start timer' }))
    act(() => { vi.advanceTimersByTime(10_000) })

    fireEvent.click(screen.getByRole('button', { name: 'Reset timer' }))
    act(() => { vi.advanceTimersByTime(5_000) })

    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })
})
