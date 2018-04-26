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

  getQueue(name) {
    if (!this.queues[name]) {
      this.queues[name] = new Queue(name, { redis: this.client })
    }

    return this.queues[name]
  }

  on(name, handler) {
    return this.getQueue(name).process(job => Promise.resolve(handler(job.data)))
  }

  send(name, payload) {
    return this.getQueue(name).createJob(payload).save()
  }
}

export default RedisQueueAdapter
