import { IsString, IsOptional, IsArray, IsBoolean, IsObject } from 'class-validator'

export class UpdatePromptDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsString()
  @IsOptional()
  category?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsObject()
  @IsOptional()
  variables?: Record<string, any>

  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
