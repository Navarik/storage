
const escape = str => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
const makeRegex = (str, pre='', suf='') => new RegExp(`${pre}${escape(str)}${suf}`, 'i')

export const findSubstring = str => makeRegex(str)
export const findPrefix = str => makeRegex(str, '^\\s*')
export const findSuffix = str => makeRegex(str, '', '\\s*$')
