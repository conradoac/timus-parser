if (typeof exports != "undefined") {
  var test = require("./driver.js").test
  var testFail = require("./driver.js").testFail
}

test("'\u2029'", {}, {ecmaVersion: 2019})
test("'\u2028'", {}, {ecmaVersion: 2019})
test("\"\u2029\"", {}, {ecmaVersion: 2019})
test("\"\u2028\"", {}, {ecmaVersion: 2019})
test("`\u2029`", {}, {ecmaVersion: 2019})
test("`\u2028`", {}, {ecmaVersion: 2019})
testFail("/\u2029/", "Expressão regular incompleta (1:1)", {ecmaVersion: 2019})
testFail("/\u2028/", "Expressão regular incompleta (1:1)", {ecmaVersion: 2019})
