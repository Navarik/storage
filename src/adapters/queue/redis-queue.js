// @flow
import Queue from 'bee-queue'
import redis from 'redis'

class RedisQueueAdapter {
  constructor(config) {
    this.queues = {}
    this.client = redis.createClient(config)
  }

  connect() {
    return Promise.resolve(this.client)
  }

  isConnected() {
    return this.client !== null
  }

  getQueue(name: string) {
    if (!this.queues[name]) {
      this.queues[name] = new Queue(name, { redis: this.client })
    }

    return this.queues[name]
  }

  on(name: string, handler) {
    return this.getQueue(name).process(job => Promise.resolve(handler(job.data)))
  }

  send(name: string, payload) {
    return this.getQueue(name).createJob(payload).save()
  }

  getLog(name: string) {
    return this.getQueue(name)
      .getJobs('succeeded', { size: 1000000000 })
      .then(jobs => jobs.map(job => job.data.payload))
      // @todo .payload doesn't belong here: it's originated in Transaction manager
  }
}

export default RedisQueueAdapter
