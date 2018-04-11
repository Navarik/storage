# Storage server

Dynamic entity storage with HTTP API

## Features
- Versioning
- Avro-style schema enforcement
- Schema changes do not require code re-deployment

## Using in docker-compose setup

```
version: '3'

services:
  ow-storage:
    image: navarik/storage:0.3.0
    environment:
      - PORT=3100
    expose:
      - 3100
```

## Running standalone

1. Running as docker image

```
docker run -e PORT=3100 -p 3100:3100 navarik/storage:latest
```

2. Running locally for development purposes

```
npm install
npm run local
```

## API

* `GET /schemata/namespaces` - returns the list of all the created schema namespaces
* `GET /schemata` - returns a list of existing schemata
* `POST /schemata` - creates new schema
* `GET /schema/<name>[/version/<version>]` - returns a schema object for the given name/version
* `PUT /schema/<name>` - creates a new version of an existing schema
* `GET /entities?<field>=<value>[&<field>=<value>...]` - returns a list of existing data objects matcing the search query
* `POST /entities` - creates a new data object
* `GET /entity/<id>[/version/<version>]` - returns a data object for the given name/version
* `PUT /entity/<id>` - creates a new version of an existing entity object
