import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule } from '@nestjs/throttler'
import { DatabaseModule } from './database/database.module'
import { CacheModule } from './cache/cache.module'
import { envValidation } from './config/env.validation'
import { WorkspaceModule } from './modules/workspace/workspace.module'
import { KnowledgeModule } from './modules/knowledge/knowledge.module'
import { ProjectsModule } from './modules/projects/projects.module'
import { SettingsModule } from './modules/settings/settings.module'
import { IntegrationsModule } from './modules/integrations/integrations.module'
import { SecretsModule } from './modules/secrets/secrets.module'
import { MonitoringModule } from './modules/monitoring/monitoring.module'
import { AiModule } from './modules/ai/ai.module'
import { DeveloperModule } from './modules/developer/developer.module'
import { HealthController } from './health.controller'
import { AuthGuard } from './shared/guards/auth.guard'
import { CorrelationIdMiddleware } from './shared/middleware/correlation-id.middleware'
import { PinoLoggerService } from './shared/logger/pino-logger.service'

@Module({
  controllers: [HealthController],
  providers: [
    PinoLoggerService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
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

    // Phase 1 Feature Modules
    WorkspaceModule,
    KnowledgeModule,
    ProjectsModule,
    SettingsModule,
    IntegrationsModule,
    SecretsModule,
    MonitoringModule,
    AiModule,
    DeveloperModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*')
  }
}

