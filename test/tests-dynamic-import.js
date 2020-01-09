// Tests for ECMAScript 2020 dynamic import

if (typeof exports != 'undefined') {
  var test = require('./driver.js').test;
  var testFail = require('./driver.js').testFail;
}

test(
  "importar('dynamicImport.js')",
  {
    type: 'Program',
    start: 0,
    end: 28,
    body: [
      {
        type: 'ExpressionStatement',
        start: 0,
        end: 28,
        expression: {
          type: 'ImportExpression',
          start: 0,
          end: 28,
          source: {
            type: 'Literal',
            start: 9,
            end: 27,
            value: 'dynamicImport.js',
            raw: "'dynamicImport.js'"
          }
        }
      }
    ],
    sourceType: 'script'
  },
  { ecmaVersion: 11 }
);

// Assignment is OK.
test(
  "importar(a = 'dynamicImport.js')",
  {
    "type": "Program",
    "start": 0,
    "end": 32,
    "body": [
      {
        "type": "ExpressionStatement",
        "start": 0,
        "end": 32,
        "expression": {
          "type": "ImportExpression",
          "start": 0,
          "end": 32,
          "source": {
            "type": "AssignmentExpression",
            "start": 9,
            "end": 31,
            "operator": "=",
            "left": {
              "type": "Identifier",
              "start": 9,
              "end": 10,
              "name": "a"
            },
            "right": {
              "type": "Literal",
              "start": 13,
              "end": 31,
              "value": "dynamicImport.js",
              "raw": "'dynamicImport.js'"
            }
          }
        }
      }
    ],
    "sourceType": "script"
  },
  { ecmaVersion: 11 }
);

// function* a() { yield import('http'); }
// função* a() { entregar import('http'); }
test(
  "função* a() { entregar importar('http'); }",
  {
    type: 'Program',
    start: 0,
    end: 42,
    body: [
      {
        type: 'FunctionDeclaration',
        start: 0,
        end: 42,
        id: { type: 'Identifier', start: 8, end: 9, name: 'a' },
        expression: false,
        generator: true,
        async: false,
        params: [],
        body: {
          type: 'BlockStatement',
          start: 12,
          end: 42,
          body: [
            {
              type: 'ExpressionStatement',
              start: 14,
              end: 40,
              expression: {
                type: 'YieldExpression',
                start: 14,
                end: 39,
                delegate: false,
                argument: {
                  type: 'ImportExpression',
                  start: 23,
                  end: 39,
                  source: { type: 'Literal', start: 32, end: 38, value: 'http', raw: "'http'" }
                }
              }
            }
          ]
        }
      }
    ],
    sourceType: 'script'
  },
  { ecmaVersion: 11 }
);

// `new import(s)` is syntax error, but `new (import(s))` is not.
test(
  "novo (importar(s))",
  {
    "type": "Program",
    "start": 0,
    "end": 18,
    "body": [
      {
        "type": "ExpressionStatement",
        "start": 0,
        "end": 18,
        "expression": {
          "type": "NewExpression",
          "start": 0,
          "end": 18,
          "callee": {
            "type": "ImportExpression",
            "start": 6,
            "end": 17,
            "source": {
              "type": "Identifier",
              "start": 15,
              "end": 16,
              "name": "s"
            }
          },
          "arguments": []
        }
      }
    ],
    "sourceType": "script"
  },
  { ecmaVersion: 11 }
);


// `import(s,t)` is syntax error, but `import((s,t))` is not.
test(
  "importar((s,t))",
  {
    "type": "Program",
    "start": 0,
    "end": 15,
    "body": [
      {
        "type": "ExpressionStatement",
        "start": 0,
        "end": 15,
        "expression": {
          "type": "ImportExpression",
          "start": 0,
          "end": 15,
          "source": {
            "type": "SequenceExpression",
            "start": 10,
            "end": 13,
            "expressions": [
              {
                "type": "Identifier",
                "start": 10,
                "end": 11,
                "name": "s"
              },
              {
                "type": "Identifier",
                "start": 12,
                "end": 13,
                "name": "t"
              }
            ]
          }
        }
      }
    ],
    "sourceType": "script"
  },
  { ecmaVersion: 11 }
);

testFail('função failsParse() { retornar importar.então(); }', 'Token não esperado (1:39)', {
  ecmaVersion: 11,
  loose: false
});

testFail("var dynImport = importar; dynImport('http');", 'Token não esperado (1:24)', {
  ecmaVersion: 11,
  loose: false
});

testFail("importar('test.js')", 'Token não esperado (1:8)', {
  ecmaVersion: 10,
  loose: false,
  sourceType: 'module'
});

testFail("importar()", 'Token não esperado (1:9)', {
  ecmaVersion: 11,
  loose: false
});

testFail("importar(a, b)", 'Token não esperado (1:10)', {
  ecmaVersion: 11,
  loose: false
});

testFail("importar(...[a])", 'Token não esperado (1:9)', {
  ecmaVersion: 11,
  loose: false
});

testFail("importar(source,)", 'Vírgula à direita não é permitida em importar() (1:15)', {
  ecmaVersion: 11,
  loose: false
});

testFail("novo importar(source)", "Não é permitido utilizar 'novo'/'nova' com 'importar()' (1:5)", {
  ecmaVersion: 11,
  loose: false
});

testFail("nova importar(source)", "Não é permitido utilizar 'novo'/'nova' com 'importar()' (1:5)", {
  ecmaVersion: 11,
  loose: false
});

testFail("(importar)(s)", 'Token não esperado (1:9)', {
  ecmaVersion: 11,
  loose: false
});
