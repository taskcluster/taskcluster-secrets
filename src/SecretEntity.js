import {cloneDeep} from 'lodash';
import assert from 'assert';
import Entity from 'azure-entities';

// Export SecretEntity
export let SecretEntity = Entity.configure({
  version:          1,
  signEntities:     true,
  partitionKey:     Entity.keys.ConstantKey('secrets'),
  rowKey:           Entity.keys.StringKey('name'),
  properties: {
    name:           Entity.types.String,
    secret:         Entity.types.EncryptedJSON,
    expires:        Entity.types.Date,
  },
});

/** Return JSON representation of the secret */
SecretEntity.prototype.json = function() {
  return {
    secret: cloneDeep(this.secret),
    expires: this.expires.toJSON(),
  };
};

/** Check if the resource is stale */
SecretEntity.prototype.isExpired = function() {
  return Date.now() > this.expires.getTime();
};

/**
 * Expire secrets that are past their expiration.
 *
 * Returns a promise that all expired secrets have been deleted.
 */
SecretEntity.expire = async function(now) {
  assert(now instanceof Date, 'now must be given as option');
  let count = 0;
  await Entity.scan.call(this, {
    expires:          Entity.op.lessThan(now),
  }, {
    limit:            250, // max number of concurrent delete operations
    handler:          (secret) => { count++; return secret.remove(true); },
  });
  return count;
};
