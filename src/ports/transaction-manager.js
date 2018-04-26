import uuidv4 from 'uuid/v4'

class TransactionManager {
  constructor({ queue, commitTopic }) {
    this.transactions = {}
    this.queue = queue
    this.commitTopic = commitTopic

    this.queue.on(this.commitTopic, message => this.resolve(message))
  }

  resolve({ transactionId, payload }) {
    this.transactions[transactionId](payload)
    delete this.transactions[transactionId]
  }

  execute(topic, payload) {
    const transactionId = uuidv4()
    const result = new Promise((resolve, reject) => {
      this.transactions[transactionId] = resolve
    })

    this.queue.send(topic, { transactionId, payload })

    return result
  }
}

export default TransactionManager
