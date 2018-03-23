import fs from 'fs'

export const getFileNames = directory => fs
  .readdirSync(directory)
  .map(fileName => `${directory}/${fileName}`)

export const readJsonFile = fileName => JSON.parse(fs.readFileSync(fileName, 'utf8'))
