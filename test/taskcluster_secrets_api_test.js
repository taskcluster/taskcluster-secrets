suite("TaskCluster-Secrets", () => {
  var helper = require('./helper');
  var assert = require('assert');
  var slugid = require('slugid');

  let testValueExpires         = {secret: {data: "bar"}, expires: "2066-10-06T07:25:54.957Z"};
  let testValueExpires2        = {secret: {data: "foo"}, expires: "2066-10-06T07:25:54.957Z"};
  let testValueExpired         = {secret: {data: "bar"}, expires: "2011-04-01T00:00:00.000Z"};
  let testValueExpiresSigned   = {secret: {data: "bar"}, expires: "2066-10-06T07:25:54.957Z", signingKey: "Butter-n-Sghetti"};
  let testValueExpiresSigned2  = {secret: {data: "foo"}, expires: "2066-10-06T07:25:54.957Z", signingKey: "Butter-n-Sghetti"};

  const FOO_KEY    = slugid.v4();
  const BAR_KEY    = slugid.v4();
  const SIGNED_KEY = slugid.v4();

  let testData = [
    // UNSIGNED TESTS
    {
      testName:   "Captain, write allowed key",
      clientName: "captain-write",
      apiCall:    "set",
      name:        "captain:" + FOO_KEY,
      args:       testValueExpires,
      res:        {}
    },
    {
      testName:   "Captain, write disallowed key",
      clientName: "captain-write",
      apiCall:    "set",
      name:       "tennille:" + FOO_KEY,
      args:       testValueExpires,
      statusCode: 401 // It's not authorized!
    },
    {
      testName:   "Captain (write only), fail to read.",
      clientName: "captain-write",
      apiCall:    "get",
      name:        "captain:" + FOO_KEY,
      statusCode: 401 // it's not authorized!
    },
    {
      testName:   "Captain (read only), read foo.",
      clientName: "captain-read",
      apiCall:    "get",
      name:       "captain:" + FOO_KEY,
      res:        testValueExpires
    },
    {
      testName:   "Captain, update allowed key",
      clientName: "captain-write",
      apiCall:    "update",
      name:        "captain:" + FOO_KEY,
      args:       testValueExpires2,
      res:        {}
    },
    {
      testName:   "Captain (read only), read updated foo.",
      clientName: "captain-read",
      apiCall:    "get",
      name:        "captain:" + FOO_KEY,
      res:        testValueExpires2
    },
    {
      testName:   "Captain (write only), delete foo.",
      clientName: "captain-write",
      apiCall:    "remove",
      name:        "captain:" + FOO_KEY,
      res:        {}
    },
    {
      testName:   "Captain (read only), read deleted foo.",
      clientName: "captain-read",
      apiCall:    "get",
      name:        "captain:" + FOO_KEY,
      statusCode: 404
    },
    {
      testName:   "Captain (write only), delete already deleted foo.",
      clientName: "captain-write",
      apiCall:    "remove",
      name:        "captain:" + FOO_KEY,
      statusCode: 404
    },
    {
      testName:   "Captain (write only), write bar that is expired.",
      clientName: "captain-write",
      apiCall:    "set",
      name:        "captain:" + BAR_KEY,
      args:       testValueExpired,
      res:        {}
    },
    {
      testName:   "Captain (read only), read bar that is expired.",
      clientName: "captain-read",
      apiCall:    "get",
      name:        "captain:" + BAR_KEY,
      statusCode: 410
    },
    {
      testName:   "Captain (write only), delete bar.",
      clientName: "captain-write",
      apiCall:    "remove",
      name:        "captain:" + BAR_KEY,
      res:        {}
    },
    // SIGNED TESTS
    {
      testName:   "(signed) Captain, write allowed key",
      clientName: "captain-write",
      apiCall:    "set",
      name:        "captain:" + SIGNED_KEY,
      args:       testValueExpiresSigned,
      res:        {}
    },
    {
      testName:   "(signed) Captain (read only), read foo.",
      clientName: "captain-read",
      apiCall:    "getSigned",
      name:       "captain:" + SIGNED_KEY,
      args:       {signingKey: testValueExpiresSigned.signingKey},
      res:        testValueExpires // The signing key won't be in the result
    },
    {
      testName:   "(signed) Captain, update allowed key",
      clientName: "captain-write",
      apiCall:    "update",
      name:        "captain:" + SIGNED_KEY,
      args:       testValueExpiresSigned2,
      res:        {}
    },
    {
      testName:   "(signed) Captain (read only), read updated foo.",
      clientName: "captain-read",
      apiCall:    "getSigned",
      name:        "captain:" + SIGNED_KEY,
      args:       {signingKey: testValueExpiresSigned.signingKey},
      res:        testValueExpires2
    },
    {
      testName:   "(signed) Captain (read only), read updated foo using a bad key.",
      clientName: "captain-read",
      apiCall:    "getSigned",
      name:       "captain:" + SIGNED_KEY,
      args:       {signingKey: "ISHOULDNOTWORK"},
      statusCode: 422
    },
    {
      testName:   "(signed) Captain (write only), delete foo.",
      clientName: "captain-write",
      apiCall:    "removeSigned",
      args:       {signingKey: testValueExpiresSigned.signingKey},
      name:       "captain:" + SIGNED_KEY,
      res:        {}
    }
  ]

  for (let options of testData) {
    test(options.testName, async function() {
      let client = helper.clients[options.clientName];
      let res = undefined;
      try {
        if (options.args) {
          res = await client[options.apiCall](options.name, options.args);
        } else {
          res = await client[options.apiCall](options.name);
        }
      } catch (e) {
        if (e.statusCode) {
          assert.deepEqual(options.statusCode, e.statusCode);
        } else {
          throw e; // if there's no statusCode this isn't an API error
        }
      }
      for (let key in options.res) {
        assert.deepEqual(res[key], options.res[key]);
      }
    });
  }
});
