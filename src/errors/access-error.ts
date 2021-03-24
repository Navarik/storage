export class AccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AccessError"
  }
}
