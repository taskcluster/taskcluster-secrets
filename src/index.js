import Debug from 'debug';
import {SecretEntity} from './SecretEntity';
import assert from 'assert';
import {isNaN} from 'lodash';
import loader from 'taskcluster-lib-loader';
import validator from 'taskcluster-lib-validate';
import monitor from 'taskcluster-lib-monitor';
import app from 'taskcluster-lib-app';
import docs from 'taskcluster-lib-docs';
import {fromNow} from 'taskcluster-client';
import config from 'typed-env-config';
import api from './api';

let debug = Debug('secrets:server');

export default loader({
  cfg: {
    requires: ['profile'],
    setup: ({profile}) => config({profile}),
  },

  monitor: {
    requires: ['process', 'profile', 'cfg'],
    setup: ({process, profile, cfg}) => monitor({
      project: 'taskcluster-secrets',
      credentials: cfg.taskcluster.credentials,
      mock: profile !== 'production',
      process,
    }),
  },

  validator: {
    requires: ['cfg'],
    setup: ({cfg}) => validator({
      prefix: 'secrets/v1/',
      aws: cfg.aws,
    }),
  },

  entity: {
    requires: ['cfg', 'monitor', 'process'],
    setup: ({cfg, monitor, process}) => SecretEntity.setup({
      account:          cfg.azure.accountName,
      credentials:      cfg.taskcluster.credentials,
      table:            cfg.azure.tableName,
      cryptoKey:        cfg.azure.cryptoKey,
      signingKey:       cfg.azure.signingKey,
      monitor:          monitor.prefix(cfg.azure.tableName.toLowerCase()),
    }),
  },

  router: {
    requires: ['cfg', 'entity', 'validator', 'monitor'],
    setup: ({cfg, entity, validator, monitor}) => api.setup({
      context:          {cfg, entity},
      authBaseUrl:      cfg.taskcluster.authBaseUrl,
      publish:          cfg.taskclusterSecrets.publishMetaData === 'true',
      baseUrl:          cfg.server.publicUrl + '/v1',
      referencePrefix:  'secrets/v1/api.json',
      aws:              cfg.aws,
      monitor:          monitor.prefix('api'),
      validator,
    }),
  },

  docs: {
    requires: ['cfg', 'validator'],
    setup: ({cfg, validator}) => docs.documenter({
      credentials: cfg.taskcluster.credentials,
      tier: 'core',
      schemas: validator.schemas,
      references: [
        {
          name: 'api',
          reference: api.reference({baseUrl: `${cfg.server.publicUrl}/v1`}),
        },
      ],
    }),
  },

  server: {
    requires: ['cfg', 'router', 'docs'],
    setup: ({cfg, router, docs}) => {
      let secretsApp = app({
        port:           Number(process.env.PORT || cfg.server.port),
        env:            cfg.server.env,
        forceSSL:       cfg.server.forceSSL,
        trustProxy:     cfg.server.trustProxy,
      });

      // Mount API router
      secretsApp.use('/v1', router);

      // Create server
      return secretsApp.createServer();
    },
  },

  expire: {
    requires: ['cfg', 'entity'],
    setup: async ({cfg, entity}) => {
      // Find an secret expiration delay
      let delay = cfg.taskclusterSecrets.secretExpirationDelay;
      let now   = fromNow(delay);
      assert(!isNaN(now), `Can't have NaN as now`);

      debug('Expiring secrets');
      let count = await entity.expire(now);
      debug(`Expired ${count} secrets`);
    },
  },
}, ['process', 'profile']);
