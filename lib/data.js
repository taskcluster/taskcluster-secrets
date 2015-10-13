import base from 'taskcluster-base';
import _ from 'lodash';

let SecretEntity = base.Entity.configure({
    version:          1,
    signEntities:     true,
    partitionKey:     base.Entity.keys.ConstantKey('secrets'),
    rowKey:           base.Entity.keys.StringKey('name'),
    properties: {
      name:           base.Entity.types.String,
      secret:         base.Entity.types.EncryptedJSON,
      expires:        base.Entity.types.Date
    }
});

// Export SecretEntity
exports.SecretEntity = SecretEntity;

/** Return JSON representation of the secret */
SecretEntity.prototype.json = function() {
  return {
    secret: _.cloneDeep(this.secret),
    expires: this.expires.toJSON()
  };
};

/** Check if the resource is stale */
SecretEntity.prototype.isExpired = function() {
  return (new Date()).getTime() > this.expires.getTime();
};
