import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsObject } from 'class-validator'

export class CreatePromptDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  content: string

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
