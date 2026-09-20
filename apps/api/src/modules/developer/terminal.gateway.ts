import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { TerminalService } from './terminal.service'
import { Logger } from '@nestjs/common'

@WebSocketGateway({
  cors: {
    origin: process.env.APP_URL,
    credentials: true,
  },
  namespace: '/terminal',
})
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(TerminalGateway.name)
  private readonly terminals = new Map<string, TerminalService>()

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected to terminal: ${client.id}`)

    if (!(await this.isAuthenticated(client))) {
      this.logger.warn(`Rejected unauthenticated terminal connection: ${client.id}`)
      client.disconnect(true)
      return
    }

    const terminalService = new TerminalService()
    this.terminals.set(client.id, terminalService)
    
    // Start terminal and stream output back to this client
    terminalService.startTerminal((data) => {
      client.emit('terminal.output', data)
    })
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from terminal: ${client.id}`)
    const terminalService = this.terminals.get(client.id)
    terminalService?.onModuleDestroy()
    this.terminals.delete(client.id)
  }

  @SubscribeMessage('terminal.input')
  handleInput(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    this.terminals.get(client.id)?.write(data)
  }

  private async isAuthenticated(client: Socket): Promise<boolean> {
    const cookie = client.handshake.headers.cookie
    if (!cookie) return false

    try {
      const authUrl = process.env.BETTER_AUTH_URL
      if (!authUrl) return false
      const response = await fetch(`${authUrl}/api/auth/get-session`, {
        headers: { cookie },
      })
      if (!response.ok) return false

      const data = (await response.json()) as { session?: unknown }
      return Boolean(data.session)
    } catch (error) {
      this.logger.warn(`Terminal session verification failed: ${String(error)}`)
      return false
    }
  }
}
