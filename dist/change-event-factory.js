"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeEventFactory = void 0;
class ChangeEventFactory {
    constructor({ ddl }) {
        this.ddl = ddl;
    }
    create(action, entity, commitMessage) {
        let schema = this.ddl.describe(entity.schema);
        // If can't find this particular version of the schema, fallback to the latest version
        if (!schema) {
            schema = this.ddl.describe(entity.type);
        }
        if (!schema) {
            throw new Error(`[Storage] Cannot find schema for ${entity.type} (schema version: ${entity.schema})`);
        }
        return {
            action,
            user: entity.modified_by,
            message: commitMessage,
            entity: entity,
            schema: schema,
            parent: undefined,
            timestamp: entity.modified_at
        };
    }
}
exports.ChangeEventFactory = ChangeEventFactory;
//# sourceMappingURL=change-event-factory.js.map