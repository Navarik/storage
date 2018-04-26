import uuidv4 from 'uuid/v4'

const noop = () => { }

class TransactionManager {
  constructor({ queue, commitTopic, onCommit }) {
    this.transactions = {}
    this.queue = queue
    this.commitTopic = commitTopic
    this.onCommit = onCommit || noop

    this.queue.on(this.commitTopic, message => {
      this.resolve(message)
      this.onCommit(message.payload)
    })
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
