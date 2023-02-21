# Filesystem Changelog Adapter

Filesystem Changelog Adapter for @navarik/storage

## Installation

```sh
npm install @navarik/storage-filesystem-changelog --save
```

## Usage example

```javascript
import ChangelogAdapter from '@navarik/storage-filesystem-changelog'
import createStorage from '@navarik/storage'

const log = new ChangelogAdapter({
  workingDirectory: '/var/storage',
  format: 'json'
})

const storage = createStorage({ log })
```
