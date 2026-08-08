import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray } from 'class-validator'

export class CreateSnippetDto {
  @IsString()
  @IsNotEmpty()
  title: string = ''

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsNotEmpty()
  content: string = ''

  @IsString()
  @IsNotEmpty()
  language: string = 'typescript'

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @IsBoolean()
  @IsOptional()
  pinned?: boolean
}
