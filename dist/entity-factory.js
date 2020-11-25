"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityFactory = void 0;
const uuid_1 = require("uuid");
const validation_error_1 = require("./errors/validation-error");
const conflict_error_1 = require("./errors/conflict-error");
class EntityFactory {
    constructor({ ddl, metaDdl, metaType }) {
        this.ddl = ddl;
        this.metaDdl = metaDdl;
        this.metaType = metaType;
    }
    create({ id, type, body, meta }, user) {
        const { isValid, message } = this.ddl.validate(type, body);
        if (!isValid) {
            throw new validation_error_1.ValidationError(`[Storage] Validation failed for ${type}. ${message}`);
        }
        const formatted = this.ddl.format(type, body);
        const formattedMeta = this.metaDdl.format(this.metaType, meta || {});
        const newId = id || uuid_1.v4();
        const now = new Date();
        const canonical = {
            id: newId,
            version_id: uuid_1.v5(JSON.stringify(formatted.body), newId),
            previous_version_id: null,
            created_by: user,
            created_at: now.toISOString(),
            modified_by: user,
            modified_at: now.toISOString(),
            type: formatted.schema.type,
            body: formatted.body,
            meta: formattedMeta.body || {},
            schema: formatted.schemaId
        };
        return canonical;
    }
    merge(oldEntity, patch, user) {
        // check if update is not based on an outdated entity
        if (!patch.version_id) {
            throw new conflict_error_1.ConflictError(`[Storage] Update unsuccessful due to missing version_id`);
        }
        if (oldEntity.version_id != patch.version_id) {
            throw new conflict_error_1.ConflictError(`[Storage] ${patch.version_id} is not the latest version id for entity ${patch.id}`);
        }
        const type = patch.type || oldEntity.type;
        const formatted = this.ddl.format(type, { ...oldEntity.body, ...(patch.body || {}) });
        const formattedMeta = this.metaDdl.format(this.metaType, { ...oldEntity.meta, ...(patch.meta || {}) });
        const now = new Date();
        return {
            id: oldEntity.id,
            version_id: uuid_1.v5(JSON.stringify(formatted.body), oldEntity.id),
            previous_version_id: oldEntity.version_id,
            created_by: oldEntity.created_by,
            created_at: oldEntity.created_at,
            modified_by: user,
            modified_at: now.toISOString(),
            type,
            body: formatted.body,
            meta: formattedMeta.body || {},
            schema: formatted.schemaId
        };
    }
}
exports.EntityFactory = EntityFactory;
//# sourceMappingURL=entity-factory.js.map