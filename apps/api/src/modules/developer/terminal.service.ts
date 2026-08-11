import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import * as os from 'os'
import { ChildProcessWithoutNullStreams, spawn as spawnCP } from 'child_process'

@Injectable()
export class TerminalService implements OnModuleDestroy {
  private readonly logger = new Logger(TerminalService.name)
  
  // Basic fallback without node-pty
  private process: ChildProcessWithoutNullStreams | null = null
  private onDataCallback: ((data: string) => void) | null = null

  startTerminal(onData: (data: string) => void) {
    this.onDataCallback = onData

    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash'
    
    this.process = spawnCP(shell, [], {
      env: process.env,
    })

    this.process.stdout.on('data', (data) => {
      if (this.onDataCallback) {
        this.onDataCallback(data.toString())
      }
    })

    this.process.stderr.on('data', (data) => {
      if (this.onDataCallback) {
        this.onDataCallback(data.toString())
      }
    })

    this.process.on('exit', (code) => {
      this.logger.log(`Terminal process exited with code ${code}`)
      if (this.onDataCallback) {
        this.onDataCallback(`\r\n[Process exited with code ${code}]\r\n`)
      }
    })
  }

  write(data: string) {
    if (this.process && this.process.stdin) {
      this.process.stdin.write(data)
    }
  }

  onModuleDestroy() {
    if (this.process) {
      this.process.kill()
    }
  }
}
