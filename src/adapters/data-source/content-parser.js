const parsers = {
  json: content => JSON.parse(content)
}

const parse = (type, content) => {
  if (!parsers[type]) {
    throw new Error(`Unknown file type: ${type}`)
  }

  return parsers[type](content)
}

export default parse
