import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreateIntegrationDto {
  @IsString()
  provider: string

  @IsString()
  @IsOptional()
  accessToken?: string

  @IsString()
  @IsOptional()
  refreshToken?: string

  @IsOptional()
  metadata?: any
}

export class UpdateIntegrationDto {
  @IsString()
  @IsOptional()
  accessToken?: string

  @IsString()
  @IsOptional()
  refreshToken?: string

  @IsOptional()
  metadata?: any

  @IsBoolean()
  @IsOptional()
  enabled?: boolean
}
