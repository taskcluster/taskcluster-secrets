import api from '../src/api';
import {createClient} from 'taskcluster-client';
import testing from 'taskcluster-lib-testing';
import load from '../src';
import config from 'typed-env-config';

// Create and export helper object
let helper = {};

// Load configuration
let cfg = config({profile: 'test'});
const baseUrl = `${cfg.server.publicUrl}/v1`;

// Some clients for the tests, with differents scopes.  These are turned
// into temporary credentials based on the main test credentials, so
// the clientIds listed here are purely internal to the tests.
let testClients = [
  {
    clientId:     'captain-write', // can write captain's secrets
    scopes:       [
      'secrets:set:captain:*',
    ],
  }, {
    clientId:     'captain-read', // can read captain's secrets
    accessToken:  'none',
    scopes:       ['secrets:get:captain:*'],
  }, {
    clientId:     'captain-read-write',
    scopes:       [
      'secrets:set:captain:*',
      'secrets:get:captain:*',
    ],
  }, {
    clientId:     'captain-read-limited',
    scopes:       [
      'secrets:get:captain:limited/*',
    ],
  },
];

let SecretsClient = createClient(api.reference({baseUrl}));

let webServer = null;

// Setup before tests
before(async () => {
  // Set up all of our clients, each with a different clientId
  helper.clients = {};
  let auth = {};
  for (let {clientId, scopes} of testClients) {
    helper.clients[clientId] = new SecretsClient({
      baseUrl:          baseUrl,
      credentials:      {clientId: clientId, accessToken: 'unused'},
    });
    auth[clientId] = scopes;
  }
  testing.fakeauth.start(auth);

  // create the Azure table
  let entity = await load('entity', {profile: 'test', process: 'test'});
  await entity.ensureTable();

  // start up the secrets service so that we can test it live
  webServer = await load('server', {profile: 'test', process: 'test'});
});

// Cleanup after tests
after(async () => {
  testing.fakeauth.stop();
  await webServer.terminate();
});

export default helper;
