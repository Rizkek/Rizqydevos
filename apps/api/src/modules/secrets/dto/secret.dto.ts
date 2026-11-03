import { Transform, Type } from 'class-transformer'
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator'

export const SECRET_LIMITS = { name: 200, key: 200, username: 200, url: 2048, value: 10_000, category: 50, description: 2000, tags: 20, tag: 50 }
export const MIN_PASSPHRASE = 12
export const MAX_IMPORT_SECRETS = 2000

export class CreateSecretDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(SECRET_LIMITS.name)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(SECRET_LIMITS.key)
  key: string

  // Empty or missing means the secret has no account (an API key). Together with key it must be unique,
  // so one site can hold several logins.
  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.username)
  username?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.url)
  url?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(SECRET_LIMITS.value)
  value: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.category)
  category?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.description)
  description?: string

  @IsArray()
  @ArrayMaxSize(SECRET_LIMITS.tags)
  @IsString({ each: true })
  @MaxLength(SECRET_LIMITS.tag, { each: true })
  @IsOptional()
  tags?: string[]
}

export class UpdateSecretDto {
  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.name)
  name?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.username)
  username?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.url)
  url?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.value)
  value?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.category)
  category?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.description)
  description?: string

  @IsArray()
  @ArrayMaxSize(SECRET_LIMITS.tags)
  @IsString({ each: true })
  @MaxLength(SECRET_LIMITS.tag, { each: true })
  @IsOptional()
  tags?: string[]
}

export class ExportSecretsDto {
  @IsString()
  @MinLength(MIN_PASSPHRASE)
  @MaxLength(256)
  passphrase: string
}

export class RestoreSecretsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  passphrase: string

  // Shape and integrity are checked by openBackup() after decryption.
  @IsObject()
  backup: Record<string, unknown>
}

export class ImportSecretItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(SECRET_LIMITS.name)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(SECRET_LIMITS.key)
  key: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.username)
  username?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.url)
  url?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(SECRET_LIMITS.value)
  value: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.category)
  category?: string

  @IsString()
  @IsOptional()
  @MaxLength(SECRET_LIMITS.description)
  description?: string
}

// The browser reads the CSV file and sends rows; the server never sees the file itself.
export class ImportSecretsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_IMPORT_SECRETS)
  @ValidateNested({ each: true })
  @Type(() => ImportSecretItemDto)
  items: ImportSecretItemDto[]

  // Counts what an import would do without writing anything, for the preview.
  // Validate the raw value: implicit conversion would turn the string "false" into true.
  @Transform(({ obj }) => obj.dryRun)
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean
}
