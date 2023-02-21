import { Logger } from '@navarik/types'

export interface Partitioner<T> {
  getPartitionKey(event: T): string
}

export interface Formatter<T> {
  fileExtension: string
  format(event: T): string
  parse(chunk: string): T
}

export type Observer<T> = (event: T) => void|Promise<void>

export interface FilesystemChangelogConfig<T> {
  workingDirectory: string
  logger: Logger
  formatter?: Formatter<T>
  partitioner?: Partitioner<T>|string
}
