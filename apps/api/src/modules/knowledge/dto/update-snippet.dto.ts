import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class UpdateSnippetDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsString()
  @IsOptional()
  language?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
