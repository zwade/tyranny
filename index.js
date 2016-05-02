var tyrant = require("./tyranny").tyrant
var console = require("beautiful-log")

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

var nero = new tyrant()
nero.addTokens({
	"LAMBDA": /^L $/,
	"DOT": /^\.$/,
	"STRING": /^[a-zA-Z0-9]+$/,
	"OPEN": /^\($/,
	"CLOSE": /^\)$/,
	"COMMA": /^, ?$/
})

nero.addRules({
	"E": "[LAMBDA STRING DOT {E}]|[OPEN ({E}) COMMA {E} CLOSE]|[STRING]"
})

console.log(nero.parse('L hi.hi'))
console.log(nero.parse('L hi.(L TEST.hi, hi)'))
