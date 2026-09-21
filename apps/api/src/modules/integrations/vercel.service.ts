import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'

@Injectable()
export class VercelService {
  private readonly logger = new Logger(VercelService.name)
  private readonly API_URL = 'https://api.vercel.com'

  constructor(private readonly integrationsService: IntegrationsService) {}

  private async fetchVercel(userId: string, endpoint: string) {
    const token = await this.integrationsService.getDecryptedToken(userId, 'vercel')
    if (!token) {
      throw new UnauthorizedException('Vercel integration not configured or token missing')
    }

    const response = await fetch(`${this.API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      this.logger.error(`Vercel API error: ${response.status} ${response.statusText}`)
      throw new UnauthorizedException('Failed to communicate with Vercel API')
    }

    return response.json()
  }

  async getDeployments(userId: string) {
    try {
      const data: any = await this.fetchVercel(userId, '/v6/deployments?limit=10')
      
      return data.deployments.map((dep: any) => ({
        id: dep.uid,
        name: dep.name,
        url: dep.url,
        state: dep.state,
        createdAt: dep.created,
        project: dep.target, // "production" etc.
      }))
    } catch (error: any) {
      this.logger.error(`Failed to fetch Vercel deployments: ${error.message}`, error.stack)
      throw new UnauthorizedException('Failed to fetch Vercel deployments.')
    }
  }
}
