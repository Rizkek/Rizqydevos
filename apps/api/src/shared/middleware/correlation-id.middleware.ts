import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import * as crypto from 'crypto'

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const headerName = 'x-request-id'
    let correlationId = req.header(headerName)

    if (!correlationId) {
      correlationId = crypto.randomUUID()
    }

    ;(req as any).correlationId = correlationId
    res.setHeader(headerName, correlationId)

    next()
  }
}