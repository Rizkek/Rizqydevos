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

@WebSocketGateway({ cors: true, namespace: '/terminal' })
export class TerminalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger(TerminalGateway.name)
  private terminalService: TerminalService

  constructor() {
    // Create a new service instance per connection if we wanted multi-user, 
    // but for local DevOS, a shared or singleton is fine. We will instantiate it here for simplicity.
    this.terminalService = new TerminalService()
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to terminal: ${client.id}`)
    
    // Start terminal and stream output back to this client
    this.terminalService.startTerminal((data) => {
      client.emit('terminal.output', data)
    })
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from terminal: ${client.id}`)
    this.terminalService.onModuleDestroy()
  }

  @SubscribeMessage('terminal.input')
  handleInput(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    this.terminalService.write(data)
  }
}
