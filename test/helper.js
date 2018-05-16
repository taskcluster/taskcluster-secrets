const _ = require('lodash');
const assert = require('assert');
const taskcluster = require('taskcluster-client');
const mocha = require('mocha');
const {fakeauth, stickyLoader, Secrets} = require('taskcluster-lib-testing');
const load = require('../src/main');
const config = require('typed-env-config');

exports.load = stickyLoader(load);

suiteSetup(async function() {
  exports.load.inject('profile', 'test');
  exports.load.inject('process', 'test');
});

// set up the testing secrets
exports.secrets = new Secrets({
  secretName: 'project/taskcluster/testing/taskcluster-secrets',
  secrets: {
    taskcluster: [
      {env: 'TASKCLUSTER_ROOT_URL', cfg: 'taskcluster.rootUrl', name: 'rootUrl'},
      {env: 'TASKCLUSTER_CLIENT_ID', cfg: 'taskcluster.credentials.clientId', name: 'clientId'},
      {env: 'TASKCLUSTER_ACCESS_TOKEN', cfg: 'taskcluster.credentials.accessToken', name: 'accessToken'},
    ],
  },
  load: exports.load,
});

// Some clients for the tests, with differents scopes.  These are turned
// into temporary credentials based on the main test credentials, so
// the clientIds listed here are purely internal to the tests.
var testClients = {
  'captain-write': ['secrets:set:captain:*'],
  'captain-read': ['secrets:get:captain:*'],
  'captain-read-write': ['secrets:set:captain:*', 'secrets:get:captain:*'],
  'captain-read-limited': ['secrets:get:captain:limited/*'],
};

exports.client = async clientId => {
  const cfg = await exports.load('cfg');
  const api = await exports.load('api');
  const SecretsClient = taskcluster.createClient(api.reference());

  return new SecretsClient({
    credentials: {clientId, accessToken: 'unused'},
    rootUrl: cfg.taskcluster.rootUrl,
  });
};

// Setup before tests
suiteSetup(async () => {
  const cfg = await exports.load('cfg');
  fakeauth.start(testClients, {rootUrl: cfg.taskcluster.rootUrl});
});

// Cleanup after tests
suiteTeardown(async () => {
  fakeauth.stop();
});

