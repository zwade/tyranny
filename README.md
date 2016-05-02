# Tyranny

Tyranny is a node module that allows for the tokenization, parsing, and mapping of arbitrary regular, context free, and context sensitive grammars. 

Tyrannyrelies on a three-stage model:
 
 - Judge &mdash; Which judges whether an input string can be tokenized, and returns its token value if so
 - Jury &mdash; Which compares the tokenized string against a grammar, and if it is valid determines the sentence
 - Executioner &mdash; Which applies a mapping function to each sentence element based on its location in the string

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
