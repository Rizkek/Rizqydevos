import { IsString, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString } from 'class-validator'
import { Priority } from '@prisma/client'

export class UpdateTodoDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority

  @IsDateString()
  @IsOptional()
  dueDate?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  completed?: boolean
}
