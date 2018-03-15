CREATE INDEX IF NOT EXISTS schema_type_version ON schema_types(version, namespace, name);
CREATE INDEX IF NOT EXISTS schema_type_latest ON schema_types(version, namespace, is_latest);
CREATE INDEX IF NOT EXISTS version_search ON versions(entity_id, version);
CREATE INDEX IF NOT EXISTS version_latest ON versions(entity_id, is_latest);
CREATE INDEX IF NOT EXISTS version_type ON versions(type);
