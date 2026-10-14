import { Transform, Type } from 'class-transformer'
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class ConnectIntegrationDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  accessToken!: string

  // Vercel only. Team resources are invisible to the API unless the team is named.
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{1,64}$/, { message: 'teamId may only contain letters, digits, underscore and hyphen' })
  teamId?: string
}

export class UpdateIntegrationDto {
  // Implicit conversion would turn the string "false" into true, so validate the raw value instead.
  @Transform(({ obj }: { obj: { enabled?: unknown } }) => obj.enabled)
  @IsBoolean()
  enabled!: boolean
}

export class DeploymentsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10
}
