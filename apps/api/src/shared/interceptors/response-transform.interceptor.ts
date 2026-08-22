import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export interface Response<T> {
  success: boolean
  data: T
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    // If it's an HTTP request, transform the response body
    const ctx = context.switchToHttp()
    const response = ctx.getResponse()

    return next.handle().pipe(
      map((data) => {
        // Handle 204 No Content
        if (response.statusCode === 204) {
          return data
        }
        
        // Return standard response format, or check if data already contains paginated meta
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
           return {
             success: true,
             data: data.items,
             meta: data.meta,
           } as any
        }
        
        // Default wrapper
        return {
          success: true,
          data: data === undefined ? null : data,
        }
      }),
    )
  }
}
