suite("TaskCluster-Secrets", () => {
  var helper = require('./helper');
  var assert = require('assert');
  var slugid = require('slugid');

  let testValueExpires = {value: "bar", expires: "2066-10-06T07:25:54.957Z"};
  let testValueExpired = {value: "bar", expires: "2011-04-01T00:00:00.000Z"};

  const FOO_KEY = slugid.v4();
  const BAR_KEY = slugid.v4();

  let testData = [
    // The "Captain" clients
    {
      testName:   "Captain, write allowed key",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      namespace:  "secrets:captain",
      key:        FOO_KEY,
      args:       testValueExpires,
      res:        {}
    },
    {
      testName:   "Captain, write disallowed key",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      namespace:  "secrets:tennille",
      key:        FOO_KEY,
      args:       testValueExpires,
      res:        401 // It's not authorized!
    },
    {
      testName:   "Captain (write only), fail to read.",
      clientName: "captain-write",
      apiCall:    "secretRead",
      namespace:  "secrets:captain",
      key:        FOO_KEY,
      res:        401 // it's not authorized!
    },
    {
      testName:   "Captain (read only), read foo.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      namespace:  "secrets:captain",
      key:        FOO_KEY,
      res:        testValueExpires
    },
    {
      testName:   "Captain (write only), delete foo.",
      clientName: "captain-write",
      apiCall:    "secretRemove",
      namespace:  "secrets:captain",
      key:        FOO_KEY,
      res:        {}
    },
    {
      testName:   "Captain (read only), read deleted foo.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      namespace:  "secrets:captain",
      key:        FOO_KEY,
      res:        404
    },
    {
      testName:   "Captain (write only), write bar that is expired.",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      namespace:  "secrets:captain",
      key:        BAR_KEY,
      args:       testValueExpired,
      res:        {}
    },
    {
      testName:   "Captain (read only), read bar that is expired.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      namespace:  "secrets:captain",
      key:        BAR_KEY,
      res:        410
    },
    {
      testName:   "Captain (write only), delete bar.",
      clientName: "captain-write",
      apiCall:    "secretRemove",
      namespace:  "secrets:captain",
      key:        BAR_KEY,
      res:        {}
    },
  ]

  for (let options of testData) {
    test(options.testName, async function() {
      let client = helper.clients[options.clientName];
      let res = undefined;
      try {
        if (options.args) {
          res = await client[options.apiCall](options.namespace, options.key, options.args);
        } else {
          res = await client[options.apiCall](options.namespace, options.key);
        }
      } catch (e) {
        res = e.statusCode;
      }
      for (let key in options.res) {
        assert.deepEqual(res[key], options.res[key]);
      }
    });
  }
});
