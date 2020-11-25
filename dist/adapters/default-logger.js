"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = void 0;
exports.defaultLogger = {
    fatal: (...args) => console.error(args),
    error: (...args) => console.error(args),
    warn: (...args) => console.warn(args),
    info: (...args) => console.info(args),
    debug: (...args) => console.debug(args),
    trace: (...args) => console.debug(args),
};
//# sourceMappingURL=default-logger.js.map