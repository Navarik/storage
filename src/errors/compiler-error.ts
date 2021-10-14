export class CompilerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CompilerError"
  }
}
