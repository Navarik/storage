import expect from 'expect.js'
import createStorage from '../src'
import fixturesEvents from './fixtures/data/events.json'
import fixtureSchemata from './fixtures/schemata/schemata.json'
import { expectEntity } from './steps/checks'
import { forAll, forNone } from './steps/generic'
import createSteps from './steps/entities'
import generateConfig from './config/adapter-list'


const run = config => {
  const storage = createStorage({
    schema: fixtureSchemata,
    ...config,
  })

  const { canCreate, cannotCreate, canFind, canCreateCollection } = createSteps(storage)

  describe(`Entity format and constraints, index type [${config.index.description || config.index}]`, () => {
    before(() => storage.init())

    it("can't create entity of unknown type", cannotCreate('wow.doge', {}))
    it("can't create empty entity", cannotCreate('profile.user', {}))
    it("can't create malformed entity", cannotCreate('profile.user', {
      role: 100500,
      last_name: ["Lisa"],
      first_name: false,
      company: "Alpha Oil Co",
      email: "lking@test.abc"
    }))

    it("can create properly structured entity", canCreate('profile.user', {
      role: "Doge",
      last_name: "Such",
      first_name: "Much",
      company: "Alpha Oil Co",
      email: "lking@test.abc"
    }))
  })
}

generateConfig().forEach(c => run(c))
