// @flow
export type Collection = Array<Object>

export type Identifier = string
export type DateTime = string
export type IdGenerator = (data: Object) => Identifier

export type AvroSchema = {
  namespace: string,
  name: string,
  type: string,
  description: '',
  fields: Array<Object>
}

export type Document<T> = {
  id: Identifier,
  type: string,
  body: T,
  created_at: DateTime,
  version: number,
  version_id: Identifier,
  modified_at: DateTime
}

export type ChangeRecord = Document<Object>
export type SchemaRecord = Document<AvroSchema>

export type Observer = Object => void

export interface QueueAdapterInterface {
  on(topic: string, handler: Observer): void;
  send(topic: string, message: Object): Promise<Object>;
  getLog(topic: string): Promise<Array<Object>>;
}

export interface ChangelogInterface {
  getVersion(versionId: Identifier): ChangeRecord;
  getLatestVersion(id: Identifier): ChangeRecord;
  logNew(type: string, id: Identifier, body: Object): Promise<ChangeRecord>;
  logChange(id: Identifier, body: Object): Promise<ChangeRecord>;
  observe(func: Observer): void;
  reconstruct(): Promise<Collection>;
}

export interface SearchIndexAdapterInterface {
  find(name: string, searchParams: Object): Promise<Collection>;
  insert(name: string, documents: Collection): Promise<number>;
  update(name: string, searchParams: Object, document: Object): Promise<number>;
  reset(): Promise<any>;
}

export interface SearchIndexInterface {
  init(log: Collection): Promise<any>;
  add(document: Object): Promise<any>;
  findLatest(params: Object): Promise<Collection>;
  findVersions(params: Object): Promise<Collection>;
}

type AdapterConfiguration = string | Object

export type ModuleConfiguration = {
  log?: AdapterConfiguration | { schema: AdapterConfiguration, entity: AdapterConfiguration },
  index?: AdapterConfiguration | { schema: AdapterConfiguration, entity: AdapterConfiguration },
  namespace?: string,
  schema?: Array<AvroSchema>,
  data?: Array<Object>
}
