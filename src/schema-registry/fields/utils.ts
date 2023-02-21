import { ValidationResponse } from "../../types"

export const isEmpty = (x: any) => (x === undefined || x === null)

export const combineValidationResponses = (items: Array<ValidationResponse>): ValidationResponse => {
  let isValid = true, message = "", separator = ""
  for (const item of items) {
    isValid &&= item.isValid

    if (item.message.length) {
      message += `${separator}${item.message}`
      separator = "; "
    }
  }

  return { isValid, message }
}