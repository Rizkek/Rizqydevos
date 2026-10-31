import { Controller, Get, Query } from '@nestjs/common'
import { CurrentUser } from '../../shared/decorators/current-user.decorator'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'
import { AuditService } from '../../shared/services/audit.service'

// Read-only audit trail shown on the Security page (moved from GET /monitoring/audit).
@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() pagination: PaginationQueryDto) {
    return this.auditService.findAll(userId, pagination)
  }
}
