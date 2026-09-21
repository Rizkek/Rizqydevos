import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../database/prisma.service'
import { AuditService } from '../../shared/services/audit.service'
import { CreateProjectDto } from './dto/create-project.dto'
import { UpdateProjectDto } from './dto/update-project.dto'
import { ProjectStatus } from '@prisma/client'
import { PaginationQueryDto } from '../../shared/dto/pagination-query.dto'

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(
    userId: string,
    filters: { status?: ProjectStatus },
    query: PaginationQueryDto,
  ) {
    return this.prisma.project.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filters.status && { status: filters.status }),
      },
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    })
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, userId, deletedAt: null },
    })

    if (!project) {
      throw new NotFoundException(`Project ${id} not found`)
    }

    return project
  }

  async create(userId: string, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description ?? null,
        status: dto.status ?? ProjectStatus.ACTIVE,
        repoUrl: dto.repoUrl ?? null,
        deployUrl: dto.deployUrl ?? null,
        color: dto.color ?? null,
        tags: dto.tags ?? [],
        techStack: dto.techStack ?? [],
        userId,
      },
    })
    await this.auditService.log(userId, 'CREATE', 'project', project.id, { name: project.name })
    return project
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    await this.findOne(id, userId)

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.repoUrl !== undefined && { repoUrl: dto.repoUrl }),
        ...(dto.deployUrl !== undefined && { deployUrl: dto.deployUrl }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.techStack !== undefined && { techStack: dto.techStack }),
      },
    })
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId)
    const result = await this.prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    await this.auditService.log(userId, 'DELETE', 'project', id)
    return result
  }
}
