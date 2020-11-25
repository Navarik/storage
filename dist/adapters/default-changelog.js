"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultChangelog = void 0;
class DefaultChangelog {
    constructor(staticLog = []) {
        this.observer = undefined;
        this.log = [...staticLog];
    }
    observe(handler) {
        this.observer = handler;
    }
    async write(message) {
        if (this.observer) {
            await this.observer(message);
        }
    }
    async readAll() {
        for (const event of this.log) {
            this.write(event);
        }
    }
    async up() { }
    async down() { }
    async isHealthy() {
        return true;
    }
}
exports.DefaultChangelog = DefaultChangelog;
//# sourceMappingURL=default-changelog.js.map