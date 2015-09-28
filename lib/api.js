import base from 'taskcluster-base';
import storage from './storage';
import _ from 'lodash';

/**
 * Check to see if a resource an expiration has passed....
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
  route:       '/scope/:secretScope',
  name:        'secretWrite',
  scopes:      ['secrets:write'],
  title:       'Create New Secret',
  description: 'Set a secret associated with some scope.'
}, async function(req, res) {
    let {secretScope} = req.params;
    let params = req.body;
    req.satisfies([secretScope])
    if (params.expires) {
      params.expires = new Date(params.expires);
      if (params.expires == 'Invalid Date') {
        res.status(400).send('expires: must be a datetime (YYYY-MM-DD hh:mm:ss)');
        return;
      }
    }
    this.storageObject.write(secretScope, params);
    res.status(204).send();
});

api.declare({
  method:      'delete',
  route:       '/scope/:secretScope',
  name:        'secretRemove',
  scopes:      ['secrets:remove'],
  title:       'Delete Secret',
  description: 'Delete the secret attached to some scope.'
}, async function(req, res) {
  let {secretScope} = req.params;
  req.satisfies([secretScope])
  this.storageObject.remove(secretScope);
  res.status(204).send();
});

api.declare({
  method:      'get',
  route:       '/scope/:secretScope',
  name:        'secretRead',
  scopes:      ['secrets:read'],
  title:       'Read Secret',
  description: 'Read the secret attached to some scope.'
}, async function(req, res) {
  let {secretScope} = req.params;
  req.satisfies([secretScope]);
  let secret = this.storageObject.read(secretScope);
  if (hasExpired(secret.expires)) {
    res.status(410).send('The requested resource has expired.');
  } else {
    res.status(200).json(secret);
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
