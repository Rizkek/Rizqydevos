import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Request, Response } from 'express'
import { Prisma } from '@prisma/client'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = 'INTERNAL_SERVER_ERROR'
    let message = 'An unexpected error occurred'
    let details: Record<string, string[]> | undefined

    // NestJS HTTP exceptions (including ValidationPipe errors)
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>
        message = (resp['message'] as string) ?? exception.message
        code = (resp['error'] as string)?.toUpperCase().replace(/ /g, '_') ?? 'HTTP_EXCEPTION'

        // Validation errors come as an array
        if (Array.isArray(resp['message'])) {
          code = 'VALIDATION_ERROR'
          message = 'Validation failed'
          details = { fields: resp['message'] as string[] }
        }
      } else {
        message = exceptionResponse as string
        code = 'HTTP_EXCEPTION'
      }
    }

    // Prisma known errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT
          code = 'DUPLICATE_ENTRY'
          message = 'A record with this value already exists'
          break
        case 'P2025':
          status = HttpStatus.NOT_FOUND
          code = 'NOT_FOUND'
          message = 'Record not found'
          break
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR
          code = 'DATABASE_ERROR'
          message = 'A database error occurred'
      }
    }

    // Unknown errors — log with stack, return sanitized message
    else {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    })
  }
}
