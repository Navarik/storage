CREATE TABLE IF NOT EXISTS properties (
  id integer PRIMARY KEY,
  version_id integer NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
  attribute text NOT NULL,
  value text,
  is_deleted boolean NOT NULL DEFAULT 0
);
