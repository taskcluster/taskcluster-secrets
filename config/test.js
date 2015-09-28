module.exports = {

  taskclusterSecrets: {
    publishMetaData:              'false',
    statsComponent:               'test-queue',
  },

  storageObject: {
    type:                         'Local',
    args:                         undefined
  },

  taskcluster: {
    authBaseUrl:                  'http://localhost:60414/v1',
    authPort:                     60414,
    credentials: {
      clientId:                   "test-server",
      accessToken:                "none"
    }
  },

  server: {
    publicUrl:                    'http://localhost:60415',
    port:                         60415
  },
};
