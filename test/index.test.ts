import { Storage, StorageConfig } from "../src"
import * as scenarios from "./scenarios"

const createStorage = <T extends object>(config: StorageConfig<T>) => new Storage<T>(config)

Object.values(scenarios).forEach(scenario => scenario(createStorage))
