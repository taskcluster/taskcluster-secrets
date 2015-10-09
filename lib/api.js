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
    "secure data in TaskCluster."
  ].join('\n')
});

// Export API
module.exports = api;

/** Define tasks */
api.declare({
  method:      'put',
  route:       '/name/:name(*)',
  deferAuth:   true,
  name:        'set',
  input:       common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:set:<name>']],
  title:       'Create New Secret',
  description: 'Set a secret associated with some key.'
}, async function(req, res) {
    req.satisfies(req.params);
    let {name} = req.params;
    let {secret, expires} = req.body;
    try {
      await this.entity.create({
        name:       name,
        secret:     secret,
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
  route:       '/name/:name(*)',
  deferAuth:   true,
  name:        'update',
  input:       common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:update:<name>']],
  title:       'Update A Secret',
  description: 'Update a secret associated with some key.'
}, async function(req, res) {
    req.satisfies(req.params);
    let {name} = req.params;
    let {secret, expires} = req.body;
    try {
      let item = await this.entity.load({name: name});
      await item.modify(function() {
        this.secret = secret;
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
  route:       '/name/:name(*)',
  deferAuth:   true,
  name:        'remove',
  scopes:      [['secrets:remove:<name>']],
  title:       'Delete Secret',
  description: 'Delete the secret attached to some key.'
}, async function(req, res) {
  req.satisfies(req.params);
  let {name} = req.params;
  try {
    await this.entity.remove({name: name});
  } catch(e) {
    res.status(e.statusCode).send(e.code);
    return;
  }
  res.status(204).send();
});

api.declare({
  method:      'get',
  route:       '/name/:name(*)',
  deferAuth:   true,
  name:        'get',
  output:      common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:get:<name>']],
  title:       'Read Secret',
  description: 'Read the secret attached to some key.'
}, async function(req, res) {
  req.satisfies(req.params);
  let {name} = req.params;
  let item = undefined;
  try {
    item = await this.entity.load({name: name});
  } catch(e) {
    res.status(e.statusCode).send(e.code);
    return;
  }
  if (hasExpired(item.expires)) {
    res.status(410).send('The requested resource has expired.');
  } else {
    res.status(200).json({secret: item.secret, expires: item.expires});
  }
});

/** Check that the server is a alive */
api.declare({
  method:   'get',
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
