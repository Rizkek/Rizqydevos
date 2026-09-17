'use client'

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Terminal } from 'xterm'
import { FitAddon } from '@xterm/addon-fit'
import 'xterm/css/xterm.css'
import { io, Socket } from 'socket.io-client'

export default function TerminalTab() {
  const terminalRef = React.useRef<HTMLDivElement>(null)
  const socketRef = React.useRef<Socket | null>(null)
  const termRef = React.useRef<Terminal | null>(null)

  React.useEffect(() => {
    if (!terminalRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      fontSize: 13,
      theme: {
        background: '#09090b',
        foreground: '#e4e4e7',
      },
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(terminalRef.current)
    fitAddon.fit()
    termRef.current = term

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const socket = io(`${apiUrl}/terminal`, {
      transports: ['websocket'],
      withCredentials: true,
    })
    socketRef.current = socket

    socket.on('terminal.output', (data) => {
      term.write(data)
    })

    term.onData((data) => {
      socket.emit('terminal.input', data)
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(terminalRef.current)

    return () => {
      resizeObserver.disconnect()
      socket.disconnect()
      term.dispose()
    }
  }, [])

  return (
    <Card className="flex flex-col h-full bg-[#09090b] border-[var(--color-border-strong)] overflow-hidden">
      <div className="h-full w-full p-2" ref={terminalRef} />
    </Card>
  )
}