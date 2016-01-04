import Debug from 'debug';
import nock from 'nock';
import hawk from 'hawk';

let debug = Debug('FakeAuth');

let clients = {};

nock('https://auth.taskcluster.net:443', {encodedQueryParams:true, allowUnmocked: true})
  .persist()
  .filteringRequestBody(/.*/, '*')
  .post('/v1/authenticate-hawk', '*')
  .reply(200, (uri, requestBody) => {
    let body = JSON.parse(requestBody);
    let authorization = hawk.utils.parseAuthorizationHeader(body.authorization);
    let scopes = clients[authorization.id] || [];
    let from = 'client config';
    if (authorization.ext) {
      let ext = JSON.parse(new Buffer(authorization.ext, 'base64')
                           .toString('utf-8'));
      if (ext.authorizedScopes) {
        scopes = ext.authorizedScopes;
        from = 'ext.authorizedScopes';
      } else if (ext.certificate.scopes) {
        scopes = ext.certificate.scopes;
        from = 'ext.certificate.scopes';
      }
    }
    debug(`authenticating access to ${body.resource} by ` +
          `${authorization.id} with scopes ${scopes.join(", ")} from ${from}`)
    return {status: "auth-success", scheme: "hawk", scopes};
  });

module.exports.setClientScopes = (client, scopes) => {
  clients[client] = scopes;
}

module.exports.reset = () => {
    clients = {};
}
