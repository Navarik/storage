"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeDbSearchIndex = void 0;
const nedb_1 = __importDefault(require("nedb"));
const ne_db_query_parser_1 = require("./ne-db-query-parser");
const stringifyProperties = (data) => {
    if (!data)
        return '';
    if (data instanceof Array) {
        return data.map(stringifyProperties);
    }
    if (typeof data === 'object') {
        const stringified = {};
        for (const field in data) {
            if (typeof data[field] !== 'function') {
                stringified[field] = stringifyProperties(data[field]);
            }
        }
        return stringified;
    }
    return `${data}`;
};
const databaseError = (err) => {
    throw new Error(`[NeDB] Database error: ${err.message}`);
};
class NeDbSearchIndex {
    constructor({ logger }) {
        this.logger = logger;
        this.client = new nedb_1.default();
        this.queryParser = new ne_db_query_parser_1.NeDbQueryParser();
        this.client.ensureIndex({ fieldName: 'id', unique: true });
    }
    async convertToSearchable(document) {
        // Removing ACL and other additional terms
        const originalDocument = {
            id: document.id,
            version_id: document.version_id,
            previous_version_id: document.previous_version_id,
            created_by: document.created_by,
            created_at: document.created_at,
            modified_by: document.modified_by,
            modified_at: document.modified_at,
            type: document.type,
            body: document.body,
            meta: document.meta,
            schema: document.schema
        };
        const searchable = {
            ___document: originalDocument,
            ...stringifyProperties(document)
        };
        return searchable;
    }
    async find(searchParams, options = {}) {
        const filter = this.queryParser.parseFilter(searchParams);
        const query = this.client.find(filter, { _id: 0 });
        const { offset, limit, sort } = options;
        if (offset) {
            query.skip(parseInt(`${offset}`));
        }
        if (limit) {
            query.limit(parseInt(`${limit}`));
        }
        let sortParams;
        if (sort) {
            sortParams = this.queryParser.parseSortQuery(sort instanceof Array ? sort : [sort]);
            query.sort(sortParams);
        }
        this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter, limit, offset, sort: sortParams }, `Performing find operation`);
        const collection = await new Promise((resolve, reject) => {
            query.exec((err, res) => {
                if (err)
                    reject(databaseError(err));
                else
                    resolve((res || []));
            });
        });
        return collection.map(x => x.___document);
    }
    async count(searchParams) {
        const filter = this.queryParser.parseFilter(searchParams);
        this.logger.trace({ component: 'Storage.NeDbSearchIndex', filter }, `Performing find operation`);
        return new Promise((resolve, reject) => {
            this.client.count(filter, (err, res) => {
                if (err)
                    reject(databaseError(err));
                else
                    resolve(res);
            });
        });
    }
    async index(document) {
        const data = await this.convertToSearchable(document);
        this.logger.trace({ component: 'Storage.NeDbSearchIndex', data }, `Indexing document`);
        return new Promise((resolve, reject) => this.client.update({ id: document.id }, data, { upsert: true, multi: true }, (err) => {
            if (err)
                reject(databaseError(err));
            else
                resolve();
        }));
    }
    async update(action, document) {
        if (action === "create" || action === "update") {
            await this.index(document);
        }
        else if (action === "delete") {
            await this.delete(document);
        }
        else {
            throw new Error(`[Storage] Unknown action: ${action}`);
        }
    }
    delete(document) {
        this.logger.trace({ component: 'Storage.NeDbSearchIndex', id: document.id }, `Deleting document`);
        return new Promise((resolve, reject) => this.client.remove({ id: document.id }, {}, (err) => {
            if (err)
                reject(databaseError(err));
            else
                resolve();
        }));
    }
    async up() {
        this.client = new nedb_1.default();
        this.client.ensureIndex({ fieldName: 'id', unique: true });
    }
    async down() { }
    async isHealthy() {
        return true;
    }
    async isClean() {
        return false;
    }
}
exports.NeDbSearchIndex = NeDbSearchIndex;
//# sourceMappingURL=ne-db-search-index.js.map