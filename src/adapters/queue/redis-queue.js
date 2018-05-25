// @flow
import Queue from 'bee-queue'
import redis from 'redis'

import type { QueueAdapterInterface, Observer, QueueMessage } from '../../flowtypes'

class RedisQueueAdapter implements QueueAdapterInterface {
  client: Object
  topics: { [string]: Object }

  constructor(config: Object) {
    this.topics = {}
    this.client = redis.createClient(config)
  }

  connect() {
    return Promise.resolve(this.client)
  }

  isConnected() {
    return this.client !== null
  }

  getQueue(name: string) {
    if (!this.topics[name]) {
      this.topics[name] = new Queue(name, { redis: this.client })
    }

    return this.topics[name]
  }

  on(name: string, handler: Observer) {
    return this.getQueue(name).process(job => Promise.resolve(handler(job.data)))
  }

  send(name: string, payload: QueueMessage) {
    return this.getQueue(name).createJob(payload).save().then(() => payload)
  }

  getLog(name: string) {
    return this.getQueue(name)
      .getJobs('succeeded', { size: 1000000000 })
      .then(jobs => jobs.map(job => job.data.payload))
      // @todo .payload doesn't belong here: it's originated in Transaction manager
  }
}

export default RedisQueueAdapter
