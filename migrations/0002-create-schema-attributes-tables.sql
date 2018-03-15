CREATE TABLE IF NOT EXISTS schema_attributes (
  id integer PRIMARY KEY,
  type_id integer NOT NULL REFERENCES schema_types(id),
  name text NOT NULL,
  datatype text NOT NULL,
  description text,
  is_deleted boolean NOT NULL DEFAULT 0
);
