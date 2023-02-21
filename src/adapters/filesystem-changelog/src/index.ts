import fs from "fs"
import path from "path"
import readline from "readline"
import mkdirp from "mkdirp"
import { Map, Logger } from "@navarik/types"
import { ChangelogAdapter } from "@navarik/storage"
import { FilesystemChangelogConfig, Partitioner, Formatter, Observer } from "./types"
import { PartitionerFactory } from "./partitioner"
import { JsonlogFormatter } from "./jsonlog-formatter"

export * from "./types"

export class FilesystemChangelogAdapter<T extends object> implements ChangelogAdapter<T> {
  private workingDirectory: string
  private formatter: Formatter<T>
  private partitioner: Partitioner<T>
  private observer: Observer<T>|null
  private streams: Map<fs.WriteStream>
  private logger: Logger

  constructor(config: FilesystemChangelogConfig<T>) {
    this.logger = config.logger
    this.formatter = config.formatter || new JsonlogFormatter()
    this.workingDirectory = path.resolve(process.cwd(), config.workingDirectory)
    this.streams = {}
    this.observer = null

    const partitionerFactory = new PartitionerFactory({ logger: this.logger })
    this.partitioner = partitionerFactory.create(config.partitioner)
  }

  private getFileStream(name: string) {
    if (!this.streams[name]) {
      this.streams[name] = fs.createWriteStream(name, { flags: "a" })
    }

    return this.streams[name]
  }

  async up() {
    if (!fs.existsSync(this.workingDirectory)) {
      mkdirp.sync(this.workingDirectory)
    }
  }

  async down() {
    for (const stream of Object.values(this.streams)) {
      stream.end()
    }
  }

  async isHealthy() {
    return true
  }

  observe(handler) {
    this.observer = handler
  }

  private async onEvent(event) {
    if (this.observer) {
      await this.observer(event)
    }
  }

  async write(event) {
    const partition = this.partitioner.getPartitionKey(event)
    const extension = this.formatter.fileExtension
    const fileName = `${this.workingDirectory}/${partition}.${extension}`
    this.getFileStream(fileName).write(this.formatter.format(event)+ "\n")

    await this.onEvent(event)
  }

  async readAll() {
    await this.up()

    const files = fs.readdirSync(this.workingDirectory)
    const completes = files.map(async (file) => {
      const stream = fs.createReadStream(`${this.workingDirectory}/${file}`)
      const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })
      for await (const line of rl) {
        await this.onEvent(this.formatter.parse(line))
      }
    })

    await Promise.all(completes)
  }
}
