import fs from 'fs'
import logger from 'logops'
import { flatten } from '../utils'

export const getFileNames = directory => fs
  .readdirSync(directory)
  .map(fileName => `${directory}/${fileName}`)

export const readJsonFile = (fileName) => {
  try {
    return JSON.parse(fs.readFileSync(fileName, 'utf8'))
  }
  catch(error) {
    logger.error(`Error reading file: [${fileName}], error: [${error}]`)
    process.exit(1)
  }
}

export const readJsonDirectory = directory =>
  flatten(getFileNames(directory).map(readJsonFile))
