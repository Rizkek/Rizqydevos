import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name)

  async getContainers() {
    try {
      // Use Docker CLI to format output as JSON
      const { stdout } = await execAsync('docker ps -a --format "{{json .}}"')
      
      if (!stdout.trim()) return []

      const containers = stdout
        .trim()
        .split('\n')
        .map(line => {
          try {
            const data = JSON.parse(line)
            return {
              id: data.ID,
              name: data.Names,
              image: data.Image,
              status: data.Status,
              state: data.State,
              ports: data.Ports,
              createdAt: data.CreatedAt,
            }
          } catch (e) {
            return null
          }
        })
        .filter(Boolean)

      return containers
    } catch (error: any) {
      this.logger.error(`Failed to get Docker containers: ${error.message}`)
      // Return empty instead of crashing if Docker is not installed or running
      return []
    }
  }

  async performAction(id: string, action: 'start' | 'stop' | 'restart' | 'remove') {
    try {
      if (!['start', 'stop', 'restart', 'rm'].includes(action === 'remove' ? 'rm' : action)) {
        throw new Error('Invalid action')
      }
      
      const cmd = action === 'remove' ? `docker rm -f ${id}` : `docker ${action} ${id}`
      await execAsync(cmd)
      return { success: true }
    } catch (error: any) {
      this.logger.error(`Failed to ${action} container ${id}: ${error.message}`)
      throw new InternalServerErrorException(`Failed to ${action} container`)
    }
  }
}
