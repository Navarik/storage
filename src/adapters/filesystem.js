import fs from 'fs'
import logger from 'logops'
import del from 'del'
import fileExtension from 'file-extension'
import { flatten } from '../utils'
import parse from './content-parser'

export const readFile = path => {
  try {
    const content = fs.readFileSync(path, 'utf8')
    return parse(fileExtension(path), content)
  }
  catch (error) {
    logger.error(`[Filesystem] Error reading file: [${path}], error: [${error}]`)
    process.exit(1)
  }
}

export const clean = directory => del.sync([`${directory}/*`, '!.gitkeep'])

export const getFileNames = directory => flatten(
  fs
    .readdirSync(directory)
    .filter(name => name[0] !== '.')
    .map(name => {
      const stats = fs.lstatSync(`${directory}/${name}`)
      if (stats.isDirectory()) {
        return getFileNames(`${directory}/${name}`)
      }

      return `${directory}/${name}`
    })
  )
