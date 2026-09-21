import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)
const DOCKER_ID_PATTERN = /^[a-f0-9]{12,64}$/i
const DOCKER_COMMAND_TIMEOUT_MS = 10_000

@Injectable()
export class DockerService {
  private readonly logger = new Logger(DockerService.name)

  async getContainers() {
    try {
      // Use Docker CLI to format output as JSON
      const { stdout } = await execFileAsync(
        'docker',
        ['ps', '-a', '--format', '{{json .}}'],
        { timeout: DOCKER_COMMAND_TIMEOUT_MS, maxBuffer: 1_024 * 1_024 },
      )
      
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to get Docker containers: ${message}`)
      // Return empty instead of crashing if Docker is not installed or running
      return []
    }
  }

  async performAction(id: string, action: 'start' | 'stop' | 'restart' | 'remove') {
    try {
      if (!DOCKER_ID_PATTERN.test(id)) {
        throw new BadRequestException('Invalid Docker container ID')
      }

      const args = action === 'remove'
        ? ['rm', '-f', id]
        : [action, id]

      await execFileAsync('docker', args, {
        timeout: DOCKER_COMMAND_TIMEOUT_MS,
        maxBuffer: 256 * 1_024,
      })
      return { success: true }
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error
      }

      const message = error instanceof Error ? error.message : String(error)
      this.logger.error(`Failed to ${action} container ${id}: ${message}`)
      throw new InternalServerErrorException(`Failed to ${action} container`)
    }
  }
}
