import { Dictionary } from '../src'

export type Step<C extends object = any> = (args: any, context: C) => any|Promise<any>

export class TestRunner<C extends object = any, S extends Dictionary<Step<C>> = {}> {
  constructor(private context: C, private steps: S) {}

  private getStep(stepName: keyof S) {
    const step = this.steps[stepName]
    if (!step) {
      throw new Error(`Step ${stepName as string} not found`)
    }

    return step
  }

  canSync(stepName: keyof S, args: any) {
    const step = this.getStep(stepName)

    return step.call(this, args, this.context)
  }

  cannotSync(stepName: string, args: any): Error {
    const step = this.getStep(stepName)

    try {
      step.call(this, args, this.context)
    } catch (err) {
      return <Error>err
    }

    throw new Error("Expected error didn't happen")
  }

  async can(stepName: keyof S, args: any) {
    const step = this.getStep(stepName)

    const res = await step.call(this, args, this.context)

    return res
  }

  async cannot(stepName: string, args: any): Promise<Error> {
    const step = this.getStep(stepName)

    try {
      await step.call(this, args, this.context)
    } catch (err) {
      return <Error>err
    }

    throw new Error("Expected error didn't happen")
  }
}
