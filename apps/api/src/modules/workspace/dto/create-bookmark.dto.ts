import { Transform } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator'

// The URL ends up in an href, so only absolute http(s) URLs are accepted (no javascript:, data:, or bare hosts).
export const BOOKMARK_URL_OPTIONS = { protocols: ['http', 'https'], require_protocol: true, require_tld: false }
export const BOOKMARK_LIMITS = { title: 500, url: 2048, description: 2000, tags: 30, tag: 50 }

export class CreateBookmarkDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(BOOKMARK_LIMITS.title)
  title: string

  @IsUrl(BOOKMARK_URL_OPTIONS)
  @MaxLength(BOOKMARK_LIMITS.url)
  url: string

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

  // Validate the raw value: implicit conversion would turn the string "false" into true.
  @Transform(({ obj }) => obj.pinned)
  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
