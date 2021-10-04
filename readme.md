# @navarik/storage
Dynamic entity storage

## Overview
Navarik Storage provides abstraction layer over application persistance layer allowing standard operations on data stored via different technologies. All stored data is normalized as no-SQL documents, typed and verifyed against standardized schemas. Changes to the data are also standardized and recorded in a log. Access control is enforced by optional plugins.

Storage supports a variety of back-end implementations for search index, schema management and access control.

## Installation
```sh
npm i @navarik/storage
```

## Basic usage
```javascript
import { Storage } from "@navarik/storage"

const storage = new Storage()

async main() {
  await storage.up()

  storage.define({
    name: "cat",
    fields: [
      { name: "meow", type: "boolean" }
    ]
  })

  const cat = await storage.create({ type: "cat", body: { meow: true } })

  cat.body.meow = false
  await storage.update(cat)

  const cats = await storage.find({ "body.meow": false })

  await storage.delete(cat.id)
}
```