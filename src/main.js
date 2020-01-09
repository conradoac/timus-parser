import { Parser } from 'acorn';

const { tokTypes, keywordTypes, lineBreak, isIdentifierChar } = Parser.acorn;
const tt = tokTypes;

export class TimusParser extends Parser {
    constructor(code, options = {}) {
        super(options, code);
        this.setLanguage(options.language);
    }

    setLanguage(language) {
        if (!language)
            return;
        this.options.language = language;
        this.keywords = this.getLanguageWordsRegExp(this.keywords);
        this.reservedWords = this.getLanguageWordsRegExp(this.reservedWords);
        this.reservedWordsStrict = this.getLanguageWordsRegExp(this.reservedWordsStrict);
        this.reservedWordsStrictBind = this.getLanguageWordsRegExp(this.reservedWordsStrictBind);
    }

    getLanguage() {
        return this.options.language;
    }

    getLanguageWordsRegExp(jsWordsRegExp) {
        if (!this.options.language)
            return jsWordsRegExp;

        let words = "";
        for (let jsWord in this.options.language) {
            if (!jsWordsRegExp.test(jsWord))
                continue;
            const synonyms = this.getLanguageSynonyms(jsWord);
            for (const syn of synonyms)
                words += " " + syn;
        }

        words = words.trim();
        return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$");
    }

    getLanguageSynonyms(jsWord) {
        if (!this.options.language || !this.options.language[jsWord])
            return [jsWord];
        return this.options.language[jsWord]
            .split("|")
            .map(langWord => langWord.trim());
    }

    getLanguageSynonym(jsWord, alt = 0) {
        if (!this.options.language || !this.options.language[jsWord])
            return jsWord;
        return this.options.language[jsWord]
            .split("|")
            .map(langWord => langWord.trim())[alt];
    }

    getJavaScriptSynonym(langWord) {
        if (!this.options.language)
            return;
        for (const jsWord in this.options.language)
            if (this.areSynonyms(langWord, jsWord))
                return jsWord;
    }

    areSynonyms(langWord, jsWord) {
        const synonyms = this.getLanguageSynonyms(jsWord);
        if (synonyms.includes(langWord))
            return true;
        return false;
    }

    readWord() {
        if (!this.options.language)
            return super.readWord();

        let word = this.readWord1();
        let type = tt.name;
        if (this.keywords.test(word)) {
            if (this.containsEsc) this.raiseRecoverable(this.start, "Escape sequence in keyword " + word);
            word = this.getJavaScriptSynonym(word); // translate it to JavaScript
            type = keywordTypes[word];
        }

        return this.finishToken(type, word);
    }

    isContextual(name) {
        if (!this.options.language)
            return super.isContextual(name);
        return this.type === tt.name && this.areSynonyms(this.value, name) && !this.containsEsc
    }

    isAsyncFunction() {
        if (!this.options.language)
            return super.isAsyncFunction();

        if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
            return false;

        const skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

        skipWhiteSpace.lastIndex = this.pos;
        let skip = skipWhiteSpace.exec(this.input);
        let next = this.pos + skip[0].length;

        // to do: allow multiple function synonyms
        const fnSynonym = this.getLanguageSynonym("function");

        return !lineBreak.test(this.input.slice(this.pos, next)) &&
            this.input.slice(next, next + fnSynonym.length) === fnSynonym &&
            (next + fnSynonym.length === this.input.length || !isIdentifierChar(this.input.charAt(next + fnSynonym.length)));
    }

    parseClassElement(constructorAllowsSuper) {
        if (!this.options.language)
            return super.parseClassElement(constructorAllowsSuper);

        if (this.eat(tt.semi)) return null;

        let method = this.startNode();
        const tryContextual = (k, noLineBreak = false) => {
            const start = this.start, startLoc = this.startLoc;
            if (!this.eatContextual(k)) return false;
            if (this.type !== tt.parenL && (!noLineBreak || !this.canInsertSemicolon())) return true;
            if (method.key) this.unexpected();
            method.computed = false;
            method.key = this.startNodeAt(start, startLoc);
            method.key.name = k;
            this.finishNode(method.key, "Identifier");
            return false;
        };

        method.kind = "method";
        method.static = tryContextual("static");
        let isGenerator = this.eat(tt.star);
        let isAsync = false;
        if (!isGenerator) {
            if (this.options.ecmaVersion >= 8 && tryContextual("async", true)) {
                isAsync = true;
                isGenerator = this.options.ecmaVersion >= 9 && this.eat(tt.star)
            } else if (tryContextual("get")) {
                method.kind = "get"
            } else if (tryContextual("set")) {
                method.kind = "set"
            }
        }
        if (!method.key) this.parsePropertyName(method);
        let { key } = method;
        let allowsDirectSuper = false;

        if (!method.computed && !method.static && (key.type === "Identifier" && this.areSynonyms(key.name, "constructor") ||
            key.type === "Literal" && this.areSynonyms(key.value, "constructor"))) {
            if (method.kind !== "method") this.raise(key.start, "Constructor can't have get/set modifier");
            if (isGenerator) this.raise(key.start, "Constructor can't be a generator");
            if (isAsync) this.raise(key.start, "Constructor can't be an async method");
            method.kind = "constructor";
            allowsDirectSuper = constructorAllowsSuper;
        } else if (method.static && key.type === "Identifier" && this.areSynonyms(key.name, "prototype")) {
            this.raise(key.start, "Classes may not have a static property named prototype");
        }
        this.parseClassMethod(method, isGenerator, isAsync, allowsDirectSuper);
        if (method.kind === "get" && method.value.params.length !== 0)
            this.raiseRecoverable(method.value.start, "getter should have no params");
        if (method.kind === "set" && method.value.params.length !== 1)
            this.raiseRecoverable(method.value.start, "setter should have exactly one param");
        if (method.kind === "set" && method.value.params[0].type === "RestElement")
            this.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params");
        return method;
    }

    parseIdent(liberal, isBinding) {
        if (!this.options.language)
            return super.parseIdent(liberal, isBinding);

        let node = this.startNode();
        if (this.type === tt.name) {
            node.name = this.value;
        } else if (this.type.keyword) {
            node.name = this.getLanguageSynonym(this.type.keyword);

            // To fix https://github.com/acornjs/acorn/issues/575
            // `class` and `function` keywords push new context into this.context.
            // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
            // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
            if ((this.areSynonyms(node.name, "class") || this.areSynonyms(node.name, "function")) &&
                (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
                this.context.pop();
            }
        } else {
            this.unexpected();
        }

        this.next();
        this.finishNode(node, "Identifier");
        if (!liberal) {
            this.checkUnreserved(node);
            if (this.areSynonyms(node.name, "await") && !this.awaitIdentPos)
                this.awaitIdentPos = node.start;
        }
        return node;
    }

    checkUnreserved({ start, end, name }) {
        if (!this.options.language) {
            super.checkUnreserved({ start, end, name });
            return;
        }

        if (this.inGenerator && this.areSynonyms(name, "yield"))
            this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator");
        if (this.inAsync && this.areSynonyms(name, "await"))
            this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function");
        if (this.keywords.test(name))
            this.raise(start, `Unexpected keyword '${name}'`);
        if (this.options.ecmaVersion < 6 &&
            this.input.slice(start, end).indexOf("\\") !== -1) return;
        const re = this.strict ? this.reservedWordsStrict : this.reservedWords;
        if (re.test(name)) {
            if (!this.inAsync && this.areSynonyms(name, "await"))
                this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function");
            this.raiseRecoverable(start, `The keyword '${name}' is reserved`);
        }
    }

    parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
        if (!this.options.language)
            return super.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);

        if ((isGenerator || isAsync) && this.type === tt.colon)
            this.unexpected();

        if (this.eat(tt.colon)) {
            prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
            prop.kind = "init";
        } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
            if (isPattern) this.unexpected();
            prop.kind = "init";
            prop.method = true;
            prop.value = this.parseMethod(isGenerator, isAsync);
        } else if (!isPattern && !containsEsc &&
            this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
            (this.areSynonyms(prop.key.name, "get") || this.areSynonyms(prop.key.name, "set")) &&
            (this.type !== tt.comma && this.type !== tt.braceR)) {
            if (isGenerator || isAsync) this.unexpected();

            // keep kind without translations
            prop.kind = this.getJavaScriptSynonym(prop.key.name);

            this.parsePropertyName(prop);
            prop.value = this.parseMethod(false);
            let paramCount = prop.kind === "get" ? 0 : 1;
            if (prop.value.params.length !== paramCount) {
                let start = prop.value.start;
                if (prop.kind === "get")
                    this.raiseRecoverable(start, "getter should have no params")
                else
                    this.raiseRecoverable(start, "setter should have exactly one param");
            } else {
                if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
                    this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params");
            }
        } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
            if (isGenerator || isAsync) this.unexpected();
            this.checkUnreserved(prop.key);
            if (this.areSynonyms(prop.key.name, "await") && !this.awaitIdentPos)
                this.awaitIdentPos = startPos;
            prop.kind = "init";
            if (isPattern) {
                prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
            } else if (this.type === tt.eq && refDestructuringErrors) {
                if (refDestructuringErrors.shorthandAssign < 0)
                    refDestructuringErrors.shorthandAssign = this.start;
                prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
            } else {
                prop.value = prop.key;
            }
            prop.shorthand = true;
        } else this.unexpected();
    }

    parseExprAtom(refDestructuringErrors) {
        if (!this.options.language || this.type !== tt.name)
            return super.parseExprAtom(refDestructuringErrors);

        let canBeArrow = this.potentialArrowAt === this.start;
        switch (this.type) {
            case tt.name:
                let startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
                let id = this.parseIdent(false);
                if (this.options.ecmaVersion >= 8 && !containsEsc && this.areSynonyms(id.name, "async") && !this.canInsertSemicolon() && this.eat(tt._function))
                    return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true);
                if (canBeArrow && !this.canInsertSemicolon()) {
                    if (this.eat(tt.arrow))
                        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false);
                    if (this.options.ecmaVersion >= 8 && this.areSynonyms(id.name, "async") && this.type === tt.name && !containsEsc) {
                        id = this.parseIdent(false);
                        if (this.canInsertSemicolon() || !this.eat(tt.arrow))
                            this.unexpected();
                        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true);
                    }
                }
                return id;
        }
    }

    parseSubscripts(base, startPos, startLoc, noCalls) {
        if (!this.options.language)
            return super.parseSubscripts(base, startPos, startLoc, noCalls);

        let maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && this.areSynonyms(base.name, "async") &&
            this.lastTokEnd === base.end && !this.canInsertSemicolon() && this.areSynonyms(this.input.slice(base.start, base.end), "async");
        while (true) {
            let element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow);
            if (element === base || element.type === "ArrowFunctionExpression") return element;
            base = element;
        }
    }

    isAsyncProp(prop) {
        if (!this.options.language)
            return super.isAsyncProp(prop);

        return !prop.computed && prop.key.type === "Identifier" && this.areSynonyms(prop.key.name, "async") &&
            (this.type === tt.name || this.type === tt.num || this.type === tt.string || this.type === tt.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === tt.star)) &&
            !lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
    }
}