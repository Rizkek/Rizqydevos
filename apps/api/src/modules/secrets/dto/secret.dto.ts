import { IsString, IsOptional } from 'class-validator'

export class CreateSecretDto {
  @IsString()
  name: string

  @IsString()
  key: string

  @IsString()
  value: string

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  description?: string
}

export class UpdateSecretDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  value?: string

  @IsString()
  @IsOptional()
  category?: string

  @IsString()
  @IsOptional()
  description?: string
}
