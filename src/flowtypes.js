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
  fields: Array<Object>
}

export type ChangeRecord = LogRecord<Object>
export type SchemaRecord = LogRecord<AvroSchema>
export type EntityRecord = LogRecord<Object>

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
  getLatestVersion(id: Identifier): ChangeRecord;
  logChange(id: Identifier, payload: Object): Promise<ChangeRecord>;
  logNew(type: string, payload: Object): Promise<ChangeRecord>;
  observe(func: Observer): void;
}

export interface IndexInterface {
  find(searchParams: Object): Promise<Collection>;
  findOne(searchParams: Object): Promise<Object>;
  insert(documents: Collection): Promise<number>;
  update(searchParams: Object, document: Object): Promise<number>;
}

export interface SearchIndexAdapterInterface {
  constructor(config: Object): void;
  getIndex(name: string): IndexInterface;
}

export interface DataSourceAdapterInterface {
  constructor(config: Object): void;
  readAllFiles(location: Location): Promise<Collection>;
}
