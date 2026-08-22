import { Injectable, UnauthorizedException, Logger } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name)

  constructor(private readonly integrationsService: IntegrationsService) {}

  private async getClient(userId: string) {
    const token = await this.integrationsService.getDecryptedToken(userId, 'github')
    if (!token) {
      throw new UnauthorizedException('GitHub integration not configured or token missing')
    }
    
    // Dynamic import to bypass ESM vs CommonJS static import restriction
    const { Octokit } = await import('@octokit/rest')
    return new Octokit({ auth: token })
  }

  async getActivityFeed(userId: string) {
    try {
      const octokit = await this.getClient(userId)
      
      // Get authenticated user
      const { data: user } = await octokit.users.getAuthenticated()
      
      // Get recent public/private events for the user
      const { data: events } = await octokit.activity.listEventsForAuthenticatedUser({
        username: user.login,
        per_page: 20,
      })

      // Parse and format events for the dashboard
      const formattedEvents = events.map(event => ({
        id: event.id,
        type: event.type,
        actor: {
          login: event.actor.login,
          avatarUrl: event.actor.avatar_url,
        },
        repo: {
          name: event.repo.name,
          url: `https://github.com/${event.repo.name}`,
        },
        payload: event.payload,
        createdAt: event.created_at,
      }))

      return formattedEvents
    } catch (error: any) {
      this.logger.error(`Failed to fetch GitHub activity: ${error.message}`, error.stack)
      throw new UnauthorizedException('Failed to communicate with GitHub. Check your token.')
    }
  }

  async getPullRequests(userId: string) {
    try {
      const octokit = await this.getClient(userId)
      // Get PRs assigned or created by user
      const { data } = await octokit.search.issuesAndPullRequests({
        q: 'is:pr is:open involves:@me',
        per_page: 10,
      })

      return data.items.map(item => ({
        id: item.id,
        title: item.title,
        url: item.html_url,
        state: item.state,
        repositoryUrl: item.repository_url, // Might need parsing to get repo name
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        author: {
          login: item.user?.login,
          avatarUrl: item.user?.avatar_url,
        },
      }))
    } catch (error: any) {
      this.logger.error(`Failed to fetch GitHub PRs: ${error.message}`, error.stack)
      throw new UnauthorizedException('Failed to communicate with GitHub. Check your token.')
    }
  }

  async getRepositories(userId: string) {
    try {
      const octokit = await this.getClient(userId)
      // Get repos for the authenticated user, sorted by pushed
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'pushed',
        per_page: 20,
      })

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        private: repo.private,
        url: repo.html_url,
        language: repo.language,
        stargazersCount: repo.stargazers_count,
        forksCount: repo.forks_count,
        updatedAt: repo.updated_at,
      }))
    } catch (error: any) {
      this.logger.error(`Failed to fetch GitHub Repositories: ${error.message}`, error.stack)
      throw new UnauthorizedException('Failed to communicate with GitHub. Check your token.')
    }
  }
}
