export class ComparisonOperator {
  private root
  private operator: string

  constructor({ root, operator }) {
    this.root = root
    this.operator = operator
  }

  async compile([field, value]: Array<any>) {
    return {
      [field]: { [this.operator]: await this.root.parseFilter(value) }
    }
  }
}
