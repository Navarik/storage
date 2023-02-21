import { Logger } from "@navarik/types"
import * as objectPath from "object-path"
import { Partitioner } from "../types"

export class KeyPartitioner<T> implements Partitioner<T> {
  private key: string

  constructor(key: string, logger: Logger) {
    this.key = key
    logger.info({ component: "FilesystemEventLog" }, `Using key partitioner based on ${key}`)
  }

  getPartitionKey(event: T) {
    return objectPath.get(event, this.key) || "undefined"
  }
}
