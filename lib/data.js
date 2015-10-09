import base from 'taskcluster-base';

var data = {} = module.exports;

data.SecretEntity = function(cfg) {
  return base.Entity.configure({
    version:          1,
    signEntities:     true,
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
    signingKey:       cfg.get('azure:signingKey')
  });
};
