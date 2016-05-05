# Tyranny

Tyranny is a node module that allows for the tokenization, parsing, and mapping of arbitrary regular, context free, and context free grammars. 

Tyranny relies on a three-stage model:
 
 - Judge &mdash; Judges whether an input string can be tokenized, and returns its token value if so
 - Jury &mdash; Compares the tokenized string against a grammar, and if it is valid determines the sentence
 - Executioner &mdash; Applies a mapping function to each sentence element based on its location in the string

## Usage

### `new tyranny.tyrant()`

`new tyranny.tyrant()` returns a new tyrant. Each tyrant can only parse one grammar, but it can have multiple rules. Specifying a grammar requires input for each of the three steps. For Judge to tokenize a string, it needs a set of rules for tokening. This can be registered as an object whose keys are the token names, and the values are regular expressions that select each token. For Jury to determine the sentence, it needs a set of rules that are defined using a regular expression-like sentence 

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
