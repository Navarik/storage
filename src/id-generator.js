import uuidv5 from 'uuid/v5'
import uuidv4 from 'uuid/v4'

const UUID_ROOT = '00000000-0000-0000-0000-000000000000'
export const hashField = fieldName => body => uuidv5(body[fieldName], UUID_ROOT)

export const random = () => body => uuidv4()
