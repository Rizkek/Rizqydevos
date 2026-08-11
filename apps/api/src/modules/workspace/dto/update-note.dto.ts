import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator'

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  title?: string

  @IsString()
  @IsOptional()
  content?: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
