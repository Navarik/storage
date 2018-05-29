// @flow
export type Collection<T: Object> = Array<T>

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
  body: T,
  created_at: DateTime
}

export type VersionInfo = {
  version: number,
  version_id: Identifier,
  modified_at: DateTime
}

export type ChangeRecord<T> = Document<T> & VersionInfo

export type TypeInfo = {
  type: string,
  schema: AvroSchema
}

export type Schema = ChangeRecord<AvroSchema>
export type Entity = ChangeRecord<Object> & TypeInfo

export type Searchable = Object

export type Observer = Object => void

export interface ChangelogAdapterInterface {
  on(topic: string, handler: Observer): void;
  write(topic: string, message: Object): Promise<Object>;
  read(topic: string): Promise<Array<Object>>;
}

export interface ChangelogInterface {
  getVersion<T>(versionId: Identifier): ChangeRecord<T>;
  getLatestVersion<T>(id: Identifier): ChangeRecord<T>;
  logNew<T>(id: Identifier, body: T): Promise<ChangeRecord<T>>;
  logChange<T>(id: Identifier, body: T): Promise<ChangeRecord<T>>;
  reconstruct<T>(): Promise<Collection<ChangeRecord<T>>>;
}

export interface SearchIndexAdapterInterface {
  find(name: string, searchParams: Object): Promise<Collection<Searchable>>;
  insert(name: string, documents: Collection<Searchable>): Promise<number>;
  update(name: string, searchParams: Object, document: Object): Promise<number>;
  reset(): Promise<any>;
}

export interface SearchIndexInterface {
  init(log: Collection<Searchable>): Promise<any>;
  add(document: Object): Promise<any>;
  findLatest(params: Object): Promise<Collection<Searchable>>;
  findVersions(params: Object): Promise<Collection<Searchable>>;
}

type AdapterConfiguration = string | Object

export type ModuleConfiguration = {
  log?: AdapterConfiguration | { schema: AdapterConfiguration, entity: AdapterConfiguration },
  index?: AdapterConfiguration | { schema: AdapterConfiguration, entity: AdapterConfiguration },
  namespace?: string,
  schema?: Array<AvroSchema>,
  data?: Array<Object>
}
