# Timus Parser

## Uma breve introdução

A principal finalidade do Timus Parser é analisar linguagens de programação com as mesmas características sintáticas de JavaScript, mas com palavras diferentes. Considere o seguinte trecho de código, escrito em JavaScript:

```javascript
function factorial(n) {
    if (n === 0)
        return 1;
    return n * factorial(n - 1);
}
```

Agora veja o mesmo trecho de código escrito em Lume, a versão correspondente de JavaScript que utiliza palavras em português.

```lume
função fatorial(n) {
    se (n === 0)
        retornar 1;
    retornar n * fatorial(n - 1);
}
```

Veja que as mesmas regras de JavaScript são válidas, mas com palavras-chave diferentes.

Observe também que optamos por mudar o identificador "factorial" para "fatorial", que é como a palavra é escrita em português. No entanto, a escolha do nome de identificadores é e continuará sendo do desenvolvedor. Fizemos isso apenas para manter a coerência com as modificações da linguagem.

Outras variações poderiam ser criadas, utilizando termos em outras línguas - espanhol, por exemplo - ou a critério de quem está criando a "nova" linguagem:

```
fn fact(n) {
    if (n === 0)
        rtn 1;
    rtn n * fact(n - 1);
}
```

Lembre-se que qualquer caractere UNICODE pode ser usado. Veja um pequeno trecho escrito em Happy, uma linguagem que utiliza emotions como sinônimos de algumas palavras:

```happy
😴 fn lazy(value) {
  🤔 (value < 1)
    👉 10;
  👉 20;
}
```

O resultado gerado pelo parser é uma estrutura de dados em árvore. Em inglês, essa estrutura é conhecida como AST (abstract syntax tree). Veja abaixo um pequeno trecho da AST gerada para o código em JavaScript dado como exemplo acima:

```json
{
  "type": "Program",
  "start": 0,
  "end": 93,
  "body": [
    {
      "type": "FunctionDeclaration",
      "start": 0,
      "end": 93,
      "id": {
        "type": "Identifier",
        "start": 9,
        "end": 18,
        "name": "factorial"
      },
      "expression": false,
      "generator": false,
      "async": false,
      "params": [
        {
          "type": "Identifier",
          "start": 19,
          "end": 20,
          "name": "n"
        }
      ],
      "body": {
          ...
      }
    }
  ],
  "sourceType": "module"
}
```

A finalidade do Timus Parser é gerar como resultado a mesma estrutura para qualquer uma das variações da linguagem. As únicas diferenças estão nos campos de início e fim de cada nodo da árvore, por causa das variações no tamanho das palavras. Isso é importante para que a estrutura seja uma representação real do código fonte analizado.

## Criando uma nova linguagem

Para criar uma nova linguagem você só precisa definir um objeto configurador que informe as respectivas palavras da linguagem.

```json
{
  "function": "fn",
  "let": "seja"
}
```

Você pode ainda definir mais de uma opção para uma mesma palavra:

```json
{
  "function": "fn",
  "let": "seja",
  "new": "novo | nova"
}
```

A ausência de uma palavra no objeto configurador não é um problema. O parser irá completar as traduções com o restante das palavras em JavaScript.

Apenas não é permitido utilizar uma mesma palavra como sinônimo de diferentes palavras-chave de JavaScript. Neste caso estaríamos com um problema...

## API

### Criando um Timus Parser

Um novo parser pode ser criado da seguinte forma:

```javascript
const parser = new TimusParser(code, options);
```

Onde `code` é o código fonte que será avaliado pelo parser e `options` é um objeto com opções para o parser.

Como o Timus Parser é uma extensão do Acorn, as mesmas opções do Acorn são válidas aqui.

### Definindo a linguagem

Você deve informar ao parser para qual linguagem ele trabalhará, inserindo uma propriedade `language` no objeto `options`. O valor desta propriedade deve ser o objeto configurador da linguagem.

```javascript
const options = {
  language: {
    function: "fn"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);
```

Se a propriedade `language` não for informada, o parser entenderá que o código a ser analizado foi escrito em JavaScript.

### Obtendo a linguagem atual do parser

Para obter a linguagem configurada para o parser, você pode utilizar o método `getLanguage`, conforme mostrado abaixo:

```javascript
const options = {
  language: {
    function: "fn"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);

const language = parser.getLanguage();
// { function: "fn" }
```

### Analisando um código

Para iniciar o processo de análise do código você deve chamar o método `parse`. Este método retorna uma AST (abstract syntax tree).

```javascript
const options = {
  language: {
    function: "fn"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);

const ast = parser.parse();
// { type: "Program" ... }
```

### Utilidades

Alguns métodos são interessantes e bastante úteis em algumas situações:

1. `getLanguageSynonyms(jsWord)`: obtém uma lista com as palavras sinônimas para a respectiva palavra em JavaScript. Se uma linguagem não tiver sido especificada, ou as definições de sinônimos para `jsWord` não forem encontradas, uma lista contendo a própria palavra como elemento será retornada.

```javascript
const options = {
  language: {
    function: "fn",
    new: "novo | nova"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);

parser.getLanguageSynonyms("function"); // ["fn"]
parser.getLanguageSynonyms("new"); // ["novo", "nova"]
parser.getLanguageSynonym("async"); // ["async"]
```


2. `getLanguageSynonym(jsWord, alt)`: obtém o sinônimo da respectiva palavra em JavaScript na linguagem corrente. `alt` é um número opcional, que especifica qual alternativa deve ser retornada, nos casos em que mais de uma opção for fornecida no objeto configurador da linguagem. Se uma linguagem não tiver sido especificada, ou se nenhuma alternativa tiver sido informada no objeto configurador, a própria palavra em JavaScript passada como argumento será retornada.

```javascript
const options = {
  language: {
    function: "fn",
    new: "novo | nova"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);

parser.getLanguageSynonym("function"); // "fn"
parser.getLanguageSynonym("new"); // "novo"
parser.getLanguageSynonym("new", 0); // "novo"
parser.getLanguageSynonym("new", 1); // "nova"
parser.getLanguageSynonym("async"); // "async"
```

3. `getJavaScriptSynonym(langWord)`: obtém o valor de uma palavra em JavaScript, a partir da respectiva palavra na linguagem corrente.

```javascript
const options = {
  language: {
    function: "fn",
    new: "novo | nova"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);

parser.getJavaScriptSynonym("fn"); // "function"
parser.getJavaScriptSynonym("novo"); // "new"
parser.getJavaScriptSynonym("nova"); // "new"
parser.getJavaScriptSynonym("xxx"); // undefined
```

3. `areSynonyms(langWord, jsWord)`: Verifica se determinada palavra na linguagem corrente (`langWord`) é sinônima à palavra `jsWord` em JavaScript.

```javascript
const options = {
  language: {
    function: "fn",
    new: "novo | nova"
  }
};

const code = "fn foo() { }";

const parser = new TimusParser(code, options);

parser.areSynonyms("fn", "function"); // true
parser.areSynonyms("novo", "new"); // true
parser.areSynonyms("nova", "new"); // true
parser.areSynonyms("fn", "new"); // false
```