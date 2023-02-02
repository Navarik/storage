import * as objectPath from "object-path"

interface SortCriterion {
  field: string
  type?: "string"|"number"|"date"|"auto"
  direction: "asc"|"desc"
}

const convertors = {
  string: (x) => x === undefined || x === null ? "" : x,
  number: (x) => x === undefined || x === null ? undefined : new Number(x),
  date: (x) => x === undefined || x === null  ? 0 : new Date(x).getTime(),
  auto: (x) => x === undefined || x === null  ? "" : x instanceof Date ? new Date(x).getTime() : x
}


const comparators = {
  asc: (a: any, b: any) => a < b ? -1 : a > b ? 1 : 0,
  desc: (a: any, b: any) => a > b ? -1 : a < b ? 1 : 0
}

export const objectCompare = <T extends object>(criteria: Array<SortCriterion>) => (a: T, b: T): 1|-1|0 => {
  for (const { field, type = "auto", direction } of criteria) {
    const convertor = convertors[type]
    const comparator = comparators[direction]

    const valueA = convertor(objectPath.get(a, field))
    const valueB = convertor(objectPath.get(b, field))

    const result = comparator(valueA, valueB)
    if (result !== 0) {
      return result
    }
  }

  return 0
}
