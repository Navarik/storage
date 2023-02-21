import { FormatResponse } from "../types"

export const isEmpty = (x: any) => (x === undefined || x === null)

export const combineValidationResponses = (items: Array<FormatResponse>): FormatResponse => {
  const value = []
  let isValid = true, message = "", separator = ""
  for (const item of items) {
    isValid &&= item.isValid

    if (item.message.length) {
      message += `${separator}${item.message}`
      separator = "; "
    }

    value.push(item.value)
  }

  return { isValid, message, value }
}

export const zip = (keys: Array<string>, values: Array<any>) =>
  values.reduce((acc: object, next: any, i: number) => ({ ...acc, [keys[i]]: next }), {})