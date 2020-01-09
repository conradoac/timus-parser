if (typeof exports != "undefined") {
  var test = require("./driver.js").test
  var testFail = require("./driver.js").testFail
}

//------------------------------------------------------------------------------
// await-top-level
//------------------------------------------------------------------------------

testFail("esperar 1", "Token não esperado (1:8)", {ecmaVersion: 8})
test("esperar 1", {
  "type": "Program",
  "start": 0,
  "end": 9,
  "body": [
    {
      "type": "ExpressionStatement",
      "start": 0,
      "end": 9,
      "expression": {
        "type": "AwaitExpression",
        "start": 0,
        "end": 9,
        "argument": {
          "type": "Literal",
          "start": 8,
          "end": 9,
          "value": 1
        }
      }
    }
  ]
}, {allowAwaitOutsideFunction: true, ecmaVersion: 8})
testFail("função foo() {retornar esperar 1}", "Token não esperado (1:31)", {ecmaVersion: 8})
testFail("função foo() {retornar esperar 1}", "Token não esperado (1:31)", {
  allowAwaitOutsideFunction: true,
  ecmaVersion: 8
})
