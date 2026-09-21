import { IsEnum } from 'class-validator'

export enum DockerAction {
  START = 'start',
  STOP = 'stop',
  RESTART = 'restart',
  REMOVE = 'remove',
}

export class DockerActionDto {
  @IsEnum(DockerAction)
  action!: DockerAction
}