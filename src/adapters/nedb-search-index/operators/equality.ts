export class EqualityOperator {
  private root

  constructor({ root }) {
    this.root = root
  }

  async compile([field, value]: Array<any>) {
    return {
      [field]: await this.root.parseFilter(value)
    }
  }
}
