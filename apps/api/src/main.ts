import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  // Security headers
  app.use(helmet())
  app.use(cookieParser())

  // CORS — strict allowlist
  app.enableCors({
    origin: process.env.APP_URL ?? 'http://localhost:3000',
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,             // strip unknown properties
      forbidNonWhitelisted: true,  // throw on unknown properties
      transform: true,             // auto-transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  )

  // Global exception filter — consistent error format
  app.useGlobalFilters(new GlobalExceptionFilter())

  // API prefix
  app.setGlobalPrefix('api/v1')

  const port = process.env.PORT ?? 3001
  await app.listen(port)

  console.log(`DevOS API running on http://localhost:${port}/api/v1`)
}

bootstrap()
