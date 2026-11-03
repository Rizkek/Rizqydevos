import { Transform } from 'class-transformer'
import { IsBoolean, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export const CHECKLIST_LIMITS = { title: 300, note: 1000, maxRepeatDays: 3650 }

// For the update DTO, null means clear the value and a missing field means leave it as it is.
// class-validator skips null and undefined after IsOptional, so null reaches the service.
export class CreateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  projectId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(CHECKLIST_LIMITS.title)
  title: string

  @IsString()
  @IsOptional()
  @MaxLength(CHECKLIST_LIMITS.note)
  note?: string

  @IsISO8601()
  @IsOptional()
  dueAt?: string

  @IsInt()
  @Min(1)
  @Max(CHECKLIST_LIMITS.maxRepeatDays)
  @IsOptional()
  repeatDays?: number

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  secretId?: string
}

export class UpdateChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(CHECKLIST_LIMITS.title)
  @IsOptional()
  title?: string

  @IsString()
  @MaxLength(CHECKLIST_LIMITS.note)
  @IsOptional()
  note?: string | null

  // Validate the raw value: implicit conversion would turn the string "false" into true.
  @Transform(({ obj }) => obj.done)
  @IsBoolean()
  @IsOptional()
  done?: boolean

  @IsISO8601()
  @IsOptional()
  dueAt?: string | null

  @IsInt()
  @Min(1)
  @Max(CHECKLIST_LIMITS.maxRepeatDays)
  @IsOptional()
  repeatDays?: number | null

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  secretId?: string | null
}

export class AddChecklistTemplatesDto {
  @IsString()
  @IsNotEmpty()
  projectId: string
}
