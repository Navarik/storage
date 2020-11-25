"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultAccessControl = void 0;
class DefaultAccessControl {
    async check(subject, action, object) {
        return {
            granted: true,
            explanation: `[DefaultAccessControl]: Granted - "${subject}" => "${action}" => "${object && object.id}"`
        };
    }
    async attachTerms(entity) {
        return entity;
    }
    async getQuery(subject, access) {
        return {};
    }
}
exports.DefaultAccessControl = DefaultAccessControl;
//# sourceMappingURL=default-access-control.js.map