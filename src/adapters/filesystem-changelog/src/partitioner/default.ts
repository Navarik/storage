import { Logger } from "@navarik/types"
import { Partitioner } from "../types"

export class DefaultPartitioner implements Partitioner<any> {
  constructor(logger: Logger) {
    logger.info({ component: "FilesystemEventLog" }, "Using default partitioner")
  }

  getPartitionKey() {
    // Send all events to the same partition
    return 'events'
  }
}