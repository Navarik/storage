export const normalizeType = (x) => x instanceof Date ? x.getTime() : x
