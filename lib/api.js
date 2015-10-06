import base from 'taskcluster-base';
import common from './common';
import slugid from 'slugid';
import _ from 'lodash';

/**
 * Check to see if a resource is stale
 **/
function hasExpired(expires) {
  let currentTime = new Date();
  let expireTime = new Date(expires);
  if (currentTime > expireTime) {
    return true;
  }
  return false;
};

/** API end-point for version v1/
 *
 * In this API implementation we shall assume the following context:
 * {
 *   publisher:      // publisher from base.Exchanges
 * }
 */
var api = new base.API({
  title:        "TaskCluster Secrets API Documentation",
  description: [
    "The secrets service, typically available at",
    "`tools.taskcluster.net`, is responsible for managing",
    "secure data via TaskCluster scopes."
  ].join('\n')
});

// Export API
module.exports = api;

/** Define tasks */
api.declare({
  method:      'put',
  deferAuth:   true,
  route:       '/namespace/:namespace/key/:key',
  name:        'secretWrite',
  input:       common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:write']],
  title:       'Create New Secret',
  description: 'Set a secret associated with some scope (namespace + key).'
}, async function(req, res) {
    let {namespace, key} = req.params;
    let {value, expires} = req.body;
    let secretScope = `${namespace}:${key}`;
    req.satisfies([[secretScope]])
    try {
      await this.entity.create({
        namespace:  namespace,
        key:        key,
        value:      value,
        expires:    new Date(expires)
      });
    } catch(e) {
      res.status(e.statusCode).send(e.code);
      return;
    }
    res.status(204).send();
});

api.declare({
  method:      'patch',
  deferAuth:   true,
  route:       '/namespace/:namespace/key/:key',
  name:        'secretUpdate',
  input:       common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:write', 'secrets:delete']],
  title:       'Update A Secret',
  description: 'Update a secret associated with some scope (namespace + key).'
}, async function(req, res) {
    let {namespace, key} = req.params;
    let {value, expires} = req.body;
    let secretScope = `${namespace}:${key}`;
    req.satisfies([[secretScope]])
    try {
      let secret = await this.entity.load({
        namespace:  namespace,
        key:        key
      });
      secret = await secret.modify(function() {
        this.value = value;
        this.expires = new Date(expires);
      });
    } catch(e) {
      res.status(e.statusCode).send(e.code);
      return;
    }
    res.status(204).send();
});

api.declare({
  method:      'delete',
  deferAuth:   true,
  route:       '/namespace/:namespace/key/:key',
  name:        'secretRemove',
  scopes:      [['secrets:remove']],
  title:       'Delete Secret',
  description: 'Delete the secret attached to some scope (namespace + key).'
}, async function(req, res) {
  let {namespace, key} = req.params;
  let secretScope = `${namespace}:${key}`;
  req.satisfies([[secretScope]]);
  try {
    await this.entity.remove({
      namespace: namespace,
      key:       key
    });
  } catch(e) {
    res.status(e.statusCode).send(e.code);
    return;
  }
  res.status(204).send();
});

api.declare({
  method:      'get',
  deferAuth:   true,
  route:       '/namespace/:namespace/key/:key',
  name:        'secretRead',
  output:      common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:read']],
  title:       'Read Secret',
  description: 'Read the secret attached to some scope.'
}, async function(req, res) {
  let {namespace, key} = req.params;
  let secretScope = `${namespace}:${key}`;
  req.satisfies([[secretScope]]);
  let secret = undefined;
  try {
    secret = await this.entity.load({
      namespace: namespace,
      key:       key
    });
  } catch(e) {
    res.status(e.statusCode).send(e.code);
    return;
  }
  if (hasExpired(secret._properties.expires)) {
    res.status(410).send('The requested resource has expired.');
  } else {
    res.status(200).json(secret._properties);
  }
});

/** Check that the server is a alive */
api.declare({
  method:   'get',
  deferAuth:   true,
  route:    '/ping',
  name:     'ping',
  title:    "Ping Server",
  description: [
    "Documented later...",
    "",
    "**Warning** this api end-point is **not stable**."
  ].join('\n')
}, function(req, res) {

  res.status(200).json({
    alive:    true,
    uptime:   process.uptime()
  });
});
