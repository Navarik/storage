// @flow
export type Collection<T: Object> = Array<T>

export type Identifier = string
export type DateTime = string
export type DocumentBody = { [string]: any }
export type IdGenerator = (data: Object) => Identifier

export type AvroSchema = {
  name: string,
  type: string,
  description: string,
  fields: Array<Object>
}

export type Document<T: Object> = {
  id: Identifier,
  body: T,
  created_at: DateTime
}

export type VersionInfo = {
  version: number,
  version_id: Identifier,
  modified_at: DateTime
}

export type TypeInfo = {
  type: string,
  schema: AvroSchema
}

export type ChangeRecord = Document<DocumentBody> & VersionInfo
export type Schema = Document<AvroSchema> & VersionInfo
export type Entity = Document<DocumentBody> & VersionInfo & TypeInfo

export type Searchable = { [string]: ?string|Searchable }

export type Observer = Object => void

export interface SignatureProviderInterface {
  signNew(body: DocumentBody): ChangeRecord;
  signVersion(body: DocumentBody, previous: ChangeRecord): ChangeRecord;
}

export interface ChangelogAdapterInterface {
  on(topic: string, handler: Observer): void;
  write(topic: string, message: Object): Promise<Object>;
  read(topic: string): Promise<Array<Object>>;
  init(): Promise<boolean>;
  isConnected(): boolean;
}

export interface ChangelogInterface {
  getVersion(versionId: Identifier): ChangeRecord;
  getLatestVersion(id: Identifier): ChangeRecord;
  logNew(body: Object): Promise<ChangeRecord>;
  logChange(id: Identifier, body: DocumentBody): Promise<ChangeRecord>;
  reconstruct(): Promise<Collection<ChangeRecord>>;
  onChange(handler: Observer): void;
}

export interface SearchIndexAdapterInterface {
  find(name: string, searchParams: Object): Promise<Collection<Searchable>>;
  insert(name: string, documents: Collection<Searchable>): Promise<number>;
  update(name: string, searchParams: Object, document: Object): Promise<number>;
  reset(): Promise<any>;
  init(): Promise<boolean>;
  isConnected(): boolean;
}

export interface SearchIndexInterface {
  init(log: Collection<ChangeRecord>): Promise<any>;
  add(document: ChangeRecord): Promise<any>;
  addCollection(document: Collection<ChangeRecord>): Promise<any>;
  find(params: Object): Promise<Collection<Searchable>>;
}

type AdapterConfiguration = string | Object

export type ModuleConfiguration = {
  log?: AdapterConfiguration | { schema: AdapterConfiguration, entity: AdapterConfiguration },
  index?: AdapterConfiguration | { schema: AdapterConfiguration, entity: AdapterConfiguration },
  schema?: Array<AvroSchema>,
  data?: { [string]: Array<Object> }
}
