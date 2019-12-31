import { DefaultChangelogAdapter } from './default-changelog-adapter'

export function createChangelogAdapter(type, content) {
  if (type === 'default') {
    if (typeof content === 'object') {
      return new DefaultChangelogAdapter({ log: content })
    } else {
      return new DefaultChangelogAdapter({})
    }
  }

  return type
}
