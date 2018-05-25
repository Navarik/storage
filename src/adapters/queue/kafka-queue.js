// @flow
import kafka from 'kafka-node'

const Producer = kafka.Producer
const Consumer = kafka.Consumer
const Client = kafka.KafkaClient

class KafkaQueueAdapter {
  client: Object
  producer: Object
  consumers: Array<Object>
  connected: boolean

  constructor(config: { kafkaHost: string }) {
    this.client = new Client({ ...config, autoConnect: false })
    this.connected = false

    this.producer = new Producer(this.client)
    this.producer.on('error', (err) => {
      console.log('[Kafka] Error', err)
    })

    this.consumers = []
  }

  connect() {
    const connectionPromise = new Promise((resolve, reject) => {
      this.producer.on('ready', () => {
        this.connected = true
        resolve(true)
      })
    })

    this.client.connect()

    return connectionPromise
  }

  isConnected() {
    return this.connected
  }

  on(name: string, handler) {
    const consumer = new Consumer(this.client, [{ topic: name }])
    consumer.on('message', message => handler(JSON.parse(message)))

    this.consumers.push(consumer)
  }

  send(name: string, payload: Object) {
    return new Promise((resolve, reject) => {
      this.producer.send(
        [{ topic: name, messages: JSON.stringify(payload) }],
        (err, result) => (err ? reject(err) : resolve(result))
      )
    })
  }

  getLog(name: string) {
    // return this.getQueue(name)
    //   .getJobs('succeeded', { size: 1000000000 })
    //   .then(jobs => jobs.map(job => job.data.payload))
    // @todo .payload doesn't belong here: it's originated in Transaction manager
  }
}

export default KafkaQueueAdapter
