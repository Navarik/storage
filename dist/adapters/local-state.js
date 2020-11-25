"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalState = void 0;
const lru_cache_1 = __importDefault(require("lru-cache"));
class LocalState {
    constructor({ size, searchIndex }) {
        this.maxSize = size;
        this.searchIndex = searchIndex;
        this.cache = new lru_cache_1.default({
            max: size,
            length: (document) => JSON.stringify(document).length
        });
    }
    async put(document) {
        this.cache.set(document.id, document);
    }
    async get(id) {
        const cachedDocument = this.cache.get(id);
        if (cachedDocument) {
            return cachedDocument;
        }
        const [foundDocument] = await this.searchIndex.find({ id }, {});
        if (foundDocument) {
            this.put(foundDocument);
        }
        return foundDocument;
    }
    async delete(id) {
        this.cache.del(id);
    }
    async up() { }
    async down() { }
    async isHealthy() {
        return true;
    }
    async stats() {
        return {
            cacheSize: this.maxSize,
            cacheUsed: this.cache.length
        };
    }
}
exports.LocalState = LocalState;
//# sourceMappingURL=local-state.js.map