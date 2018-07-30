class InMemoryStateAdapter {
  constructor() {
    this.versions = {}
    this.latest = {}
  }

  exists(key) {
    return (key in this.latest)
  }

  set(key, item) {
    if (!this.versions[key]) {
      this.versions[key] = []
    }

    this.versions[key].push(item)
    this.latest[key] = item
  }

  get(key) {
    return this.latest[key]
  }

  getVersion(key, versionNumber) {
    return this.versions[key][versionNumber - 1]
  }

  getAll() {
    return this.latest
  }

  reset() {
    this.latest = {}
    this.versions = {}
  }
}

export default InMemoryStateAdapter
