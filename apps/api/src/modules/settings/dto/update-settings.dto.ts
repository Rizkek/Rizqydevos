import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  theme?: string

  @IsString()
  @IsOptional()
  density?: string

  @IsString()
  @IsOptional()
  accentColor?: string

  @IsBoolean()
  @IsOptional()
  sidebarOpen?: boolean
}
