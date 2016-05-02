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

var ivan = new tyrant()
ivan.addTokens({
	"PLUS": /^\+$/,
	"MINUS": /^\-$/,
	"LSTART": /^\[$/,
	"LEND": /^\]$/,
	"INPUT": /^,$/,
	"OUTPUT": /^\.$/,
	"LEFT": /^\<$/,
	"RIGHT": /^\>$/,
})

var loop = ivan.compile("LSTART ({E}) LEND").apply( (l) => l[1] )

ivan.addRules({
	"LOOP": loop,
	"E": "[LEFT|RIGHT|OUTPUT|INPUT|PLUS|MINUS|{LOOP}]*"
})

console.log(ivan.parse("+>+>+-<-<-"))
console.log(ivan.parse("++++++[->+<]"))
