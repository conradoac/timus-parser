if (typeof exports != "undefined") {
  var test = require("./driver.js").test
  var testFail = require("./driver.js").testFail
}

test("tentar {} capturar {}", {
  type: "Program",
  start: 0,
  end: 21,
  body: [
    {
      type: "TryStatement",
      start: 0,
      end: 21,
      block: {
        type: "BlockStatement",
        start: 7,
        end: 9,
        body: []
      },
      handler: {
        type: "CatchClause",
        start: 10,
        end: 21,
        param: null,
        body: {
          type: "BlockStatement",
          start: 19,
          end: 21,
          body: []
        }
      },
      finalizer: null
    }
  ],
  sourceType: "script"
}, {ecmaVersion: 10})
