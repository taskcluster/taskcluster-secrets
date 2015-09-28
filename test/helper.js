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

// Some default clients for the mockAuthServer
var defaultClients = [
  {
  clientId:     'test-server',  // Hardcoded into config/test.js
  accessToken:  'none',
  scopes:       ['auth:credentials'],
  expires:      new Date(3000, 0, 0, 0, 0, 0, 0)
  }, {
  clientId:     'captain-write', // can write captain's secrets
  accessToken:  'none',
  scopes:       ['secrets:write', 'secrets:remove', 'secrets:captain:*'],
  expires:      new Date(3000, 0, 0, 0, 0, 0, 0)
  }, {
  clientId:     'captain-read', // can read captain's secrets
  accessToken:  'none',
  scopes:       ['secrets:read', 'secrets:captain:*'],
  expires:      new Date(3000, 0, 0, 0, 0, 0, 0)
  }
];

// Hold reference to authServer
var authServer = null;
var webServer = null;

var SecretsClient = taskcluster.createClient(
  api.reference({baseUrl: baseUrl})
);

// Set up all of our clients
helper.clients = {};
for (let client of defaultClients) {
  helper.clients[client.clientId] = new SecretsClient({
    baseUrl:          baseUrl,
    credentials: {
      clientId:       client.clientId,
      accessToken:    client.accessToken
    },
    authorizedScopes: client.scopes
  });
};

// Setup before tests
mocha.before(async () => {
  // Create mock authentication server
  authServer = await base.testing.createMockAuthServer({
  port:     cfg.get('taskcluster:authPort'),
  clients:  defaultClients,
  });
  webServer = await bin.server('test')
});

// Cleanup after tests
mocha.after(async () => {
  // Kill webServer
  await webServer.terminate();
  await authServer.terminate();
});
