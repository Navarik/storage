export class BinaryLogicOperator {
  private root
  private operator: string

  constructor({ root, operator }) {
    this.root = root
    this.operator = operator
  }

  async compile(args: Array<any>) {
    return {
      [this.operator]: await Promise.all(args.map(this.root.parseFilter.bind(this.root)))
    }
  }
}
