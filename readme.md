# Storage server

HTTP interface to an entity storage

## Features
- Versioning
- Avro-style schema enforcement
- Schema changes do not require code re-deployment

## Running

1. Running as docker image

```
docker run -e PORT=3100 -p 3100:3100 navarik/storage:latest
```

2. Running locally for development purposes

```
npm install
npm run local
```
