export class UnaryLogicOperator {
  private root
  private operator: string

  constructor({ root, operator }) {
    this.root = root
    this.operator = operator
  }

  async compile([arg]: Array<any>) {
    return {
      [this.operator]: await this.root.parseFilter(arg)
    }
  }
}
