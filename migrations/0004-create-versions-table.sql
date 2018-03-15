CREATE TABLE IF NOT EXISTS versions (
  id integer PRIMARY KEY,
  entity_id integer NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  type text NOT NULL,
  is_latest boolean NOT NULL DEFAULT 1,
  is_deleted boolean NOT NULL DEFAULT 0
);
