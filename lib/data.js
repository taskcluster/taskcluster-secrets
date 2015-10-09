import base from 'taskcluster-base';
import Promise from 'promise';

var data = module.exports = {};

/**
 * This wrapper exists to aid in setup of entities that vary by
 * signing key, because signing keys are added during entity setup
 * and each request may define a different signing key.
 * args:
 *  cfg        {...}, // A config object
 *  signingKey '...'  // Some secret key for verifying entries
 **/
data.genSecretEntity = function(cfg, signingKey) {
  return new Promise(function(accept, reject) {
    try {
      accept(
        base.Entity.configure({
          version:          1,
          // Only set to true if there is a signing key
          signEntities:     signingKey ? true : false,
          partitionKey:     base.Entity.keys.ConstantKey('secrets'),
          rowKey:           base.Entity.keys.StringKey('name'),
          properties: {
            name:           base.Entity.types.String,
            secret:         base.Entity.types.EncryptedJSON,
            expires:        base.Entity.types.Date
          }
        }).setup({
          account:          cfg.get('azure:accountName'),
          credentials:      cfg.get('taskcluster:credentials'),
          table:            cfg.get('azure:tableName'),
          cryptoKey:        cfg.get('azure:cryptoKey'),
          signingKey:       signingKey
        }));
    } catch (e) {
      reject(e);
    }
  });
};
