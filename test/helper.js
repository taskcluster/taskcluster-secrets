import assert from 'assert';
import base from 'taskcluster-base';
import api from '../lib/api';
import taskcluster from 'taskcluster-client';
import mocha from 'mocha';
import common from '../lib/common';
var bin = {
  server:         require('../bin/server'),
};

// Create and export helper object
var helper = module.exports = {};

// Load configuration
var cfg = common.loadConfig('test');
const baseUrl = cfg.get('server:publicUrl') + '/v1';

// All client shoulds expire within a minute
const ClientExpiration = new Date((new Date()).getTime() + (60 * 1000));

// Some default clients for the mockAuthServer
var defaultClients = [
  {
  clientId:     'test-server',  // Hardcoded into config/test.js
  scopes:       ['auth:credentials'],
  expiry:       ClientExpiration,
  credentials:  cfg.get('taskcluster:credentials')
  }, {
  clientId:     'captain-write', // can write captain's secrets
  scopes:       ['secrets:write', 'secrets:remove', 'secrets:captain:*'],
  expiry:      ClientExpiration,
  credentials:  cfg.get('taskcluster:credentials')
  }, {
  clientId:     'captain-read', // can read captain's secrets
  accessToken:  'none',
  scopes:       ['secrets:read', 'secrets:captain:*'],
  expiry:      ClientExpiration,
  credentials:  cfg.get('taskcluster:credentials')
  }
];

var webServer = null;

var SecretsClient = taskcluster.createClient(
  api.reference({baseUrl: baseUrl})
);

// Set up all of our clients
helper.clients = {};
for (let client of defaultClients) {
  helper.clients[client.clientId] = new SecretsClient({
    baseUrl:          baseUrl,
    credentials: taskcluster.createTemporaryCredentials(client),
    authorizedScopes: client.scopes
  });
};

// Setup before tests
mocha.before(async () => {
  webServer = await bin.server('test')
});

// Cleanup after tests
mocha.after(async () => {
  // Kill webServer
  await webServer.terminate();
});
