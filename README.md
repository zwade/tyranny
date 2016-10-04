# Tyranny

Tyranny is a node module that allows for the tokenization, parsing, and mapping of arbitrary regular, and context free grammars using a regular expression like syntax. 

Tyranny relies on a three-stage model:
 
 - Judge &mdash; Judges whether an input string can be tokenized, and returns its token value if so
 - Jury &mdash; Compares the tokenized string against a grammar, and if it is valid determines the sentence
 - Executioner &mdash; Applies a mapping function to each sentence element based on its location in the string

## Usage

### `new tyranny.tyrant()`

`new tyranny.tyrant()` returns a new tyrant. Each tyrant can only parse one grammar, but it can have multiple rules. Specifying a grammar requires input for each of the three steps. For Judge to tokenize a string, it needs a set of rules for tokening. This can be registered as an object whose keys are the token names, and the values are regular expressions that select each token. For Jury to determine the sentence, it needs a set of rules that are defined using a regular expression-like sentence 

### `tyrant.addTokens(tokens)`

`tyrant.addTokens(tokens)` takes a single parameter, `tokens` which represents a key value pair mapping token names to a regular expression that defines them. This will be used in the lexing step, and will be available to your grammar. Make sure all rules start with `^` and end with `$`!

### `tyrant.addRules(rules)`

`tyrant.addRules(rules)`, like `addTokens` takes a single parameter which represents a key value pair of grammatical expression names, with the rules that define them. These rules can either be a string (as defined in the section **Grammar Syntax**) or as a compiled grammar from `tyrant.compile`.

### `tyrant.compile(rule)`

`tyrant.compile(rule)` takes a grammar string and compiles it into a tyranny rule. Rules that are compiled with `tyrant.compile` expose a `.apply()` function that can be passed another function that is called with the value that this expression matched. For instance, if you compiled an expression that matches on two consecutive integers, when this rule is applied to a string with two integers, it will pass an array with both those integers to the function passed to apply. Note, `.apply` will always give an array. See the examples for how to use this.

In addition, if a rule is compiled without reference to another expression (i.e. is a regular grammar), then it can be applied directly to a string by calling it on that string. All tyranny rules are functions on strings.


### `tyrant.parse(string, [expression])`

`tyrant.parse(string, expression)` will attempt to match the string given against the exressions added with `addRules`. If `[expression]` is provided, it will only test against that named expression. The return value of this is the set of strings catagorized by their individual tokens. Unless an apply function has been called on this expression, the return value will be of type `(string, expression) array`. If no rules match, `false` will be returned. 

## Core Grammar Rules

Grammatical rules are defined by strings following a regular expression type syntax.

### Tokens

To match against a token, you can simply type the name of the token. It is a recommended convention that tokens be all uppercase, and they must be alphabetical characters.

`"TOKENNAME" -> [tokStr]` 

### Concatenation

To match the concatenation of two tokens or expressions, simply write them together with a space in between.

`"TOKENONE TOKENTWO TOKENTHREE" -> [tokStr1, tokStr2, tokStr3]`

### Kleene Star

A kleene star matches any number of an expression. It is denoted by a `*` following the desired expression to match.

`"TOKENNAME*" -> [tokStr, tokStr, tokStr, ...]`

### Alternation

To match one expression or another, place a vertical bar (`|`) between them with no whitespace 

`"TOKENONE|TOKENTWO" -> [someTokStr]`

### Matching Group

To define a matching group, or a group of symbols represented as one expression, use brackets around them. Placing brackets around a rule does not change the output, however it does associate them for the purpose of matching.

`"[TOKENONE|TOKENTWO] TOKENTHREE" -> [someTokeStr, tokStr3]`

### Logical Group

A logical group is like a matching group, except that the results will be associated when returned. That is, the items placed in a logical group will be in an array to themselves in the returned expression. These are denoted with parentheses

`"[TOKENONE (TOKENTWO TOKENTHREE)]|TOKENFOUR" -> `either` [tokStr1, [tokStr2, tokStr3]] `or` [tokStr4]`.

### Expression

An expression is like a token, except it matches another grammar rule instead of a token. It is denoted by braces

`E = "[TOKENONE {E}]|TOKENTWO" -> [tokStr1, tokStr1, tokStr1, ..., tokStr2]`

### Maybe

The "maybe" operator checks to see if there is either 0 or 1 match of a given token. It is denoted by a question mark

`"TOKENONE? TOKENTWO" -> `either` [tokStr1, tokStr2] `or` [tokStr2]`.

### None

The none keyword is used to check if there are no instances of anything. Since the rule as a whole requires the entire string to be matched, this is only rarely useful, but it can come in handy. It is denoted by a `#NONE`

`TOKENONE [TOKENTWO|TOKENTHREE|#NONE]" -> `either` [tokStr1, tokStr2]`,` [tokStr1, tokStr3]`, or` [tokStr1]`. 

## Example Usage

Here is an example of creating a language to parse valid parentheses matching

```js
var george = new tyrant()
george.addTokens({
	"OPEN": /^\($/,
	"CLOSE": /^\)$/
})

george.addRules({
	"E": "(OPEN CLOSE)|(OPEN {E} CLOSE)|[{E} {E}]"
})

console.log(george.parse("()"))
console.log(george.parse("(())"))
console.log(george.parse("(()())"))
console.log(george.parse("()()(())"))
console.log(george.parse("(()"))
console.log(george.parse(")("))
```

The first four examples, which are validly matched parentheses, will output an array of the matching strings

```js
[ [ '(', ')' ] ]
[ [ '(', [ '(', ')' ], ')' ] ]
[ [ '(', [ '(', ')' ], [ '(', ')' ], ')' ] ]
[ [ '(', ')' ], [ '(', ')' ], [ '(', [ '(', ')' ], ')' ] ]
```

The last two examples, which are invalidly matched parentheses, will return false.

Tyranny can also be used to map function to each parsed block. For instance, if trying to evaluate postfix arithmatic, you can compile each grammar string and use its `.apply` method to add an application function.

```js
var frank = new tyrant()
frank.addTokens({
	"NUMBER": /^[0-9\.]+[ ]*$/,
	"PLUS": /^\+[ ]*$/,
	"MINUS": /^\-[ ]*$/,
	"TIMES": /^\*[ ]*$/,
	"DIVIDE": /^\/[ ]*$/,
})

var num = frank.compile("NUMBER").apply( parseFloat )
var plus   = frank.compile("{E} {E} PLUS").apply(   (l) => l[0]+l[1] )
var minus  = frank.compile("{E} {E} MINUS").apply(  (l) => l[0]-l[1] )
var times  = frank.compile("{E} {E} TIMES").apply(  (l) => l[0]*l[1] )
var divide = frank.compile("{E} {E} DIVIDE").apply( (l) => l[0]/l[1] )


frank.addRules({
	"NUM": num,
	"PLUS": plus,
	"MINUS": minus,
	"TIMES": times,
	"DIVIDE": divide,
	"E": "{NUM}|{PLUS}|{MINUS}|{TIMES}|{DIVIDE}"
})

console.log(frank.parse("3")[0])
console.log(frank.parse("3 2 +")[0])
console.log(frank.parse("4 3 2 + * 5 /")[0])
console.log(frank.parse("4 0 /")[0])
```

will output

```js
3
5
4
Infinity
```

According to suffix rules of arithmetic parsing.


## More Examples

For more examples, look in the `/tests/` directory of this repository.
