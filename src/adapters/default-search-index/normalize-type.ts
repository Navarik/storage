export const normalizeType = (x: any) => x instanceof Date ? x.getTime() : x
