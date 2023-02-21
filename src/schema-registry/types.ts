export interface FormatResponse {
  isValid: boolean
  message: string
  value: any
}

export interface DataField {
  format(value: any): Promise<FormatResponse>
  hydrate(value: any, user: string): Promise<any>
}
