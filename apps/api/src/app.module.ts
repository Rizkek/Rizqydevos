import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { CacheModule } from './cache/cache.module'
import { envValidation } from './config/env.validation'

@Module({
  imports: [
    // Environment variables — validated at startup
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),

    // Rate limiting — global
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,  // 1 minute
        limit: 100,   // 100 requests per minute per IP
      },
    ]),

    // Database
    DatabaseModule,

    // Redis cache
    CacheModule,

    // Feature modules (added as each module is implemented)
    // WorkspaceModule,
    // KnowledgeModule,
    // DeveloperModule,
    // InfrastructureModule,
    // SecurityModule,
    // MonitoringModule,
    // AiModule,
    // AutomationModule,
  ],
})
export class AppModule {}
