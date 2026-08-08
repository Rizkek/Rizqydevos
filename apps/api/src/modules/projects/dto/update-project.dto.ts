import { IsString, IsOptional, IsEnum, IsArray, IsUrl } from 'class-validator'
import { ProjectStatus } from '@prisma/client'

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus

  @IsUrl()
  @IsOptional()
  repoUrl?: string

  @IsUrl()
  @IsOptional()
  deployUrl?: string

  @IsString()
  @IsOptional()
  color?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStack?: string[]
}
