
import { Storage, StorageConfig } from '@navarik/storage/test/types'
import * as scenarios from "@navarik/storage/test/scenarios"
import { dirSync as tmpDirSync } from 'tmp'
import { FilesystemChangelogAdapter } from '../src'
import { nullLogger } from '@navarik/storage/test/fixtures/null-logger'

const createStorage = <T extends object>(config: StorageConfig<T>) => {
  const dir = tmpDirSync({ mode: 0o700, prefix: 'st-fs-chlog' })
  const changelog = new FilesystemChangelogAdapter({
    workingDirectory: dir.name,
    logger: nullLogger,
  })

  return new Storage<T>({...config, changelog})
}

Object.values(scenarios).forEach(scenario => scenario(createStorage))
