import base from 'taskcluster-base';
import common from './common';
import data from './data';
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
  input:       common.SCHEMA_PREFIX_CONST + "set-secret.json#",
  scopes:      [['secrets:set:<name>']],
  title:       'Create New Secret',
  description: 'Set a secret associated with some key.'
}, async function(req, res) {
    req.satisfies(req.params);
    let {name} = req.params;
    let {secret, expires, signingKey} = req.body;
    try {
      let entity = await data.genSecretEntity(this.cfg, signingKey);
      await entity.create({
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
  input:       common.SCHEMA_PREFIX_CONST + "update-secret.json#",
  scopes:      [['secrets:update:<name>']],
  title:       'Update A Secret',
  description: 'Update a secret associated with some key.'
}, async function(req, res) {
    req.satisfies(req.params);
    let {name} = req.params;
    let {secret, expires, signingKey} = req.body;
    try {
      let entity = await data.genSecretEntity(this.cfg, signingKey);
      let item = await entity.load({name: name});
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
      let entity = await data.genSecretEntity(this.cfg);
      await entity.remove({name: name});
    } catch(e) {
      res.status(e.statusCode).send(e.code);
      return;
    }
    res.status(204).send();
});

api.declare({
  method:      'delete',
  route:       '/signed/name/:name(*)',
  deferAuth:   true,
  name:        'removeSigned',
  input:       common.SCHEMA_PREFIX_CONST + "delete-signed-secret.json#",
  scopes:      [['secrets:remove:<name>']],
  title:       'Delete A Signed Secret',
  description: 'Delete the secret attached to some key. A valid signature is required.'
}, async function(req, res) {
    req.satisfies(req.params);
    let {name} = req.params;
    let {signingKey} = req.body;
    try {
      let entity = await data.genSecretEntity(this.cfg, signingKey);
      await entity.remove({name: name});
    } catch(e) {
      if (e.message == "Signature validation failed!") {
        res.status(422).send(e.message);
        return;
      } else if (e.statusCode) {
        res.status(e.statusCode).send(e.code);
        return;
      }
      throw e;
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
    let name = req.params.name;
    let item = undefined;
    try {
      let entity = await data.genSecretEntity(this.cfg);
      item = await entity.load({name: name});
    } catch(e) {
      res.status(e.statusCode).send(e.code);
      return;
    }
    if (hasExpired(item._properties.expires)) {
      res.status(410).send('The requested resource has expired.');
    } else {
      res.status(200).json(item._properties);
    }
});

api.declare({
  method:      'get',
  route:       '/signed/name/:name(*)',
  deferAuth:   true,
  name:        'getSigned',
  input:       common.SCHEMA_PREFIX_CONST + "get-signed-secret.json#",
  output:      common.SCHEMA_PREFIX_CONST + "secret.json#",
  scopes:      [['secrets:get:<name>']],
  title:       'Read A Signed Secret',
  description: 'Read the secret attached to some key. A valid signature is required.'
}, async function(req, res) {
    req.satisfies(req.params);
    let {name} = req.params;
    let {signingKey} = req.body;
    let item = undefined;
    try {
      let entity = await data.genSecretEntity(this.cfg, signingKey);
      item = await entity.load({name: name});
    } catch(e) {
      if (e.message == "Signature validation failed!") {
        res.status(422).send(e.message);
        return;
      } else if (e.statusCode) {
        res.status(e.statusCode).send(e.code);
        return;
      }
      throw e;
    }
    if (hasExpired(item._properties.expires)) {
      res.status(410).send('The requested resource has expired.');
    } else {
      res.status(200).json(item._properties);
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
