// @flow
export type Collection = Array<Object>

export type Location = {
  pathname: string,
  resource: string,
  protocols: Array<string>
}

export interface DataSourceAdapterInterface {
  constructor(config: Object): void;
  readAllFiles(location: Location): Promise<Collection>;
}

export interface IndexInterface {
  find(searchParams: Object): Promise<Collection>;
  findOne(searchParams: Object): Promise<Object>;
  insert(documents: Collection): Promise<Collection>;
  update(searchParams: Object, document: Object): Promise<Collection>;
}

export interface SearchIndexAdapterInterface {
  constructor(config: Object): void;
  getIndex(name: string): IndexInterface;
}

export type Formatter = <T: Object|Collection>(input: T) => T

export type SearchIndexConfig = {
  formatIn: Formatter,
  formatOut: Formatter,
  adapter: SearchIndexAdapterInterface
}

export type Identifier = string
