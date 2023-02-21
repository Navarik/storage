import { Logger } from "@navarik/types"
import { Partitioner } from "../types"
import { DefaultPartitioner } from "./default"
import { KeyPartitioner } from "./key"

export class PartitionerFactory<T> {
  logger: Logger

  constructor({ logger }: { logger: Logger }) {
    this.logger = logger
  }

  create(config: string|Partitioner<T>): Partitioner<T> {
    const partitionerConfig = config || "default"
    if (typeof partitionerConfig === "object") {
      return partitionerConfig
    }

    const [type, key] = partitionerConfig.split(":")
    if (type === "default") {
      return new DefaultPartitioner(this.logger)
    }
    if (type === "random") {
      return new DefaultPartitioner(this.logger)
    }
    if (type === "key") {
      return new KeyPartitioner<T>(key, this.logger)
    }

    throw new Error(`[FilesystemEventLog] Unknown partitioner type: ${type}`)
  }
}
