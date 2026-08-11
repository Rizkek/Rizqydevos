import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsUrl } from 'class-validator'

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsUrl()
  @IsNotEmpty()
  url: string

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
