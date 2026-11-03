import { Transform } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'
import { BOOKMARK_LIMITS, BOOKMARK_URL_OPTIONS } from './create-bookmark.dto'

export class UpdateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(BOOKMARK_LIMITS.title)
  title?: string

  @IsUrl(BOOKMARK_URL_OPTIONS)
  @IsOptional()
  @MaxLength(BOOKMARK_LIMITS.url)
  url?: string

  @IsString()
  @IsOptional()
  @MaxLength(BOOKMARK_LIMITS.description)
  description?: string

  @IsString()
  @IsOptional()
  @MaxLength(BOOKMARK_LIMITS.url)
  favicon?: string

  @IsArray()
  @ArrayMaxSize(BOOKMARK_LIMITS.tags)
  @IsString({ each: true })
  @MaxLength(BOOKMARK_LIMITS.tag, { each: true })
  @IsOptional()
  tags?: string[]

  @Transform(({ obj }) => obj.pinned)
  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
