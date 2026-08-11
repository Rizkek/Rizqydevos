import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator'

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string

  @IsString()
  @IsNotEmpty()
  content: string

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
