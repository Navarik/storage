// @flow
export type Collection = Array<Object>

export type Identifier = string
export type DateTime = string
export type IdGenerator = (data: Object) => Identifier

export type Message<T> = {
  id: Identifier,
  created_at: DateTime,
  type: string,
  payload: T
}

export type VersionMetadata = {
  version: number,
  version_id: Identifier,
  modified_at: DateTime
}

export type LogRecord<T: Object> = Message<T> & VersionMetadata

export type AvroSchema = {
  namespace: string,
  name: string,
  type: string,
  description: '',
  fields: Array<Object>
}

export type ChangeRecord = LogRecord<Object>
export type SchemaRecord = LogRecord<AvroSchema>

export type Location = {
  pathname: string,
  resource: string,
  protocols: Array<string>
}

export type QueueMessage = Message<Object>
export type Observer = QueueMessage => void

export interface QueueAdapterInterface {
  connect(): Promise<Object>;
  isConnected(): boolean;
  on(topic: string, handler: Observer): void;
  send(topic: string, message: QueueMessage): void;
  getLog(topic: string): Promise<Array<QueueMessage>>;
}

export interface ChangelogInterface {
  getVersion(versionId: Identifier): ChangeRecord;
  getLatestVersion(id: Identifier): ChangeRecord;
  logNew(type: string, id: Identifier, payload: Object): Promise<ChangeRecord>;
  logChange(id: Identifier, payload: Object): Promise<ChangeRecord>;
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

export interface DataSourceAdapterInterface {
  constructor(config: Object): void;
  readAllFiles(location: Location): Promise<Collection>;
}

export interface DataSourceInterface {
  read(path: ?string): Promise<?Collection>;
}

export interface ModelInterface {
  init(source: ?Collection): Promise<void>;
  get(name: Identifier, version: ?string): Promise<?ChangeRecord>;
  find(params: Object): Promise<Array<ChangeRecord>>;
  create(type: string, body: Object): Promise<ChangeRecord>; //@todo schemas don't have type!!
  update(id: Identifier, body: Object): Promise<ChangeRecord>;
}
