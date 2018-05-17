//@flow
import fs from 'fs'
import logger from 'logops'
import del from 'del'
import fileExtension from 'file-extension'
import { flatten } from '../../utils'
import parse from './content-parser'

import type { Collection } from '../../flowtypes'

export const readFile = (path: string): ?Object => {
  try {
    const content = fs.readFileSync(path, 'utf8')
    return parse(fileExtension(path), content)
  }
  catch (error) {
    logger.error(`[Filesystem] Error reading file: [${path}], error: [${error}]`)
    process.exit(1)
  }
}

export const clean = (directory: string): void =>
  del.sync([`${directory}/*`, '!.gitkeep'])

export const getFileNames = (directory: string): Array<string> =>
  flatten(
    fs.readdirSync(directory)
      .filter(name => name[0] !== '.')
      .map(name => {
        const location = `${directory}/${name}`
        if (fs.lstatSync(location).isDirectory()) {
          return getFileNames(location)
        }

        return location
      })
  )

export function readAllFiles(path: string, format: ?string): Collection {
  const result = []
  const names = getFileNames(path)

  for (let name of names) {
    if (!format || fileExtension(name) === format) {
      const file = readFile(name)
      if (file) {
        result.push(file)
      }
    }
  }

  return result
}
