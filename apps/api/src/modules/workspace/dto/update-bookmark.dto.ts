import { IsString, IsOptional, IsArray, IsBoolean, IsUrl } from 'class-validator'

export class UpdateBookmarkDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsUrl()
  @IsOptional()
  url?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  favicon?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
