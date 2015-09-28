suite("TaskCluster-Secrets", () => {
  var helper = require('./helper');
  var assert = require('assert');

  let testValueNoExpires = {value: "bar"};
  let testValueExpires = {value: "bar", expires: "2066-04-01 00:00:00"};
  let testValueExpired = {value: "bar", expires: "2011-04-01 00:00:00"};

  let testData = [
    // The "Captain" clients
    {
      testName:   "Captain, write allowed key",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      key:        "secrets:captain:foo",
      args:      testValueNoExpires,
      res:        {}
    },
    {
      testName:   "Captain, write disallowed key",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      key:        "secrets:tennille:foo",
      args:      testValueNoExpires,
      res:        401 // It's not authorized!
    },
    {
      testName:   "Captain (write only), fail to read.",
      clientName: "captain-write",
      apiCall:    "secretRead",
      key:        "secrets:captain:foo",
      res:        401 // it's not authorized!
    },
    {
      testName:   "Captain (read only), read foo.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      key:        "secrets:captain:foo",
      res:        testValueNoExpires
    },
    {
      testName:   "Captain (write only), delete foo.",
      clientName: "captain-write",
      apiCall:    "secretRemove",
      key:        "secrets:captain:foo",
      res:        {}
    },
    {
      testName:   "Captain (read only), read deleted foo.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      key:        "secrets:captain:foo",
      res:        404
    },
    {
      testName:   "Captain (write only), write foo that expires.",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      key:        "secrets:captain:foo",
      args:        testValueExpires,
      res:          {}
    },
    {
      testName:   "Captain (read only), read foo that expires.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      key:        "secrets:captain:foo",
      res:        testValueExpires
    },
    {
      testName:   "Captain (write only), write foo that is expired.",
      clientName: "captain-write",
      apiCall:    "secretWrite",
      key:        "secrets:captain:foo",
      args:       testValueExpired,
      res:        {}
    },
    {
      testName:   "Captain (read only), read foo that is expired.",
      clientName: "captain-read",
      apiCall:    "secretRead",
      key:        "secrets:captain:foo",
      res:        410
    }
  ]

  for (let options of testData) {
    test(options.testName, async function() {
      let client = helper.clients[options.clientName];
      let res = undefined;
      try {
        if (options.args) {
          res = await client[options.apiCall](options.key, options.args);
        } else {
          res = await client[options.apiCall](options.key);
        }
      } catch (e) {
        res = e.statusCode;
      }
      assert.deepEqual(res, options.res);
    });
  }
});
