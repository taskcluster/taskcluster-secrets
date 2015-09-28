import _debug from 'debug';

let debug = _debug('secrets:storage');

const NotImplementedError = new Error("Method not implemented");

/**
 * A base class for deriving storage types.
 **/
class BaseStorageObject {
  write(key, params) {
    throw NotImplementedError;
  }
  remove(key) {
    throw NotImplementedError;
  }
  read(key) {
    throw NotImplementedError;
  }
};

export class Local extends BaseStorageObject {
  constructor() {
    super();
    this._storage = {};
    debug("ATTENTION: Local storage enabled, do not write real secrets!");
  }

  /**
   * key   : 'scopeName',
   * params: {
   *  value:   'somevalue',
   *  expires: 'YYYY-MM-DD HH:MM:SS TZ',
   * }
   **/
  write(key, params) {
    this._storage[key] = params;
  }

  remove(key) {
    if (!this._storage[key]) {
      throw new Error("can't remove a value that doesn't exist.");
    }
    delete this._storage[key];
  }

  read(key) {
    return this._storage[key];
  }
};

// TODO: Implement an Azure backed storage object
export class Azure extends BaseStorageObject {
  constructor(credentials) {
    super();
  }
}
