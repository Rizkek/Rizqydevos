import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean, IsArray, IsDateString } from 'class-validator'
import { Priority } from '@prisma/client'

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string = ''

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
}
