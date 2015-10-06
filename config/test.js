const TEST_TABLE_NAME = 'AzureTableName';

module.exports = {

  taskclusterSecrets: {
    publishMetaData:              'false',
    statsComponent:               'test-queue',
  },

  azure: {
    tableName:   TEST_TABLE_NAME,
    cryptoKey:   'CNcj2aOozdo7Pn+HEkAIixwninIwKnbYc6JPS9mNxZk='
  },

  taskcluster: {
    authBaseUrl:                  'https://auth.taskcluster.net/v1',
  },

  server: {
    publicUrl:                    'http://localhost:60415',
    port:                         60415
  },
};
