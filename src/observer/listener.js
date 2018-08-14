import path from 'object-path'

const createListener = (filter, handler) => (data) => {
  for (let fieldName in filter) {
    if (path.get(data, fieldName) !== filter[fieldName]) {
      return
    }
  }

  handler(data)
}

export default createListener
