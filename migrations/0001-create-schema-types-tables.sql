CREATE TABLE IF NOT EXISTS schema_types (
  id integer PRIMARY KEY,
  version integer NOT NULL DEFAULT 1,
  namespace text NOT NULL,
  name text NOT NULL,
  description text,
  is_latest boolean NOT NULL DEFAULT 1,
  is_deleted boolean NOT NULL DEFAULT 0
);
