import { Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator'
import { BOOKMARK_LIMITS, BOOKMARK_URL_OPTIONS } from './create-bookmark.dto'

export const MAX_IMPORT_ITEMS = 2000

export class ImportBookmarkItemDto {
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

  @IsArray()
  @ArrayMaxSize(BOOKMARK_LIMITS.tags)
  @IsString({ each: true })
  @MaxLength(BOOKMARK_LIMITS.tag, { each: true })
  @IsOptional()
  tags?: string[]

  // ADD_DATE from a browser export; keeps the original order and age of the link.
  @IsISO8601()
  @IsOptional()
  createdAt?: string
}

export class ImportBookmarksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPORT_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => ImportBookmarkItemDto)
  items: ImportBookmarkItemDto[]
}
