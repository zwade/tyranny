const tyranny = require("../tyranny")
const console = require("beautiful-log")
try {
	const readline = require("readline-sync")
} catch (e) {
	console.error("Please run `npm install readline-sync` to run this test")
	process.exit(0)
}

let mao = new tyranny.tyrant(true)
mao.addTokens({
	"GOLEFT": /^\(>\'\-\'\)>$/,
	"GORIGHT": /^<\(\'\-\'<\)$/,
	"FINISH": /^v\(\'\-\'\)v$/,
	"DIGIT": /^[0-9]$/,
	"PUSHRIGHT": /^\(0_0\)_$/,
	"PUSHLEFT": /^_\(0_0\)$/,
	"EYES": /^[:;BX]$/,
	"NOSES": /^[\-~+\*]$/,
	"MOUTHS": /^[DO\(\)]$/,
	"WHITESPACE": /^[ \t\n]+$/,
})

let number = mao.compile("DIGIT").apply(parseInt)
let whitespace = mao.compile("WHITESPACE").apply( () => null )

// Takes stack and register, returns a value //
let eyes = mao.compile("EYES").apply( ([m]) => (stack, reg) => {
	if (m == ":") return stack.pop()
	if (m == ";") return reg.value
	if (m == "B") return 0 // #OOPS
	if (m == "X") return 0
})

//Take two inputs and returns a value //
let noses = mao.compile("NOSES").apply( ([n]) => (v1, v2) => {
	if (n == "-") return v1 - v2
	if (n == "+") return v1 + v2
	if (n == "*") return v1 * v2
	if (n == "~") return v1 ? 0 : 1
})

//Take the stack, register, and a value, and place the value in its location //
let mouths = mao.compile("MOUTHS").apply( ([m]) => (stack, reg, v) => {
	if (m == ")") return stack.push(v)
	if (m == "(") return reg.value = v
	if (m == "O") return process.stdout.write(String.fromCharCode(v))
	if (m == "D") return process.stdout.write(v.toString())
})

//Take the stack and register and a direction, and modifies them in place //
let rightFace = mao.compile("{EYES} {NOSES} {MOUTHS}+").apply( ([e, n, ...m]) => (stack, reg, dir) => {
	if (dir.value == 1) return
	let val1 = stack.pop()
	let val2 = e(stack, reg)
	let result = n(val1, val2)
	for (let eat of m) eat(stack, reg, result)
})

let leftFace = mao.compile("{MOUTHS}+ {NOSES} {EYES}").apply( ([...m]) => (stack, reg, dir) => {
	if (dir.value == 0) return
	let [n,e] = m.splice(-2)
	let val1 = stack.pop()
	let val2 = e(stack, reg)
	let result = n(val1, val2)
	for (let eat of m) eat(result)
})

//Take the stack, register, and a direction, and push a value onto the stack
let rightPush = mao.compile("PUSHRIGHT {NUMBER}").apply( ([_, n]) => (stack, reg, dir) => {
	if (dir.value == 1) return
	stack.push(n)
})

let leftPush = mao.compile("{NUMBER} PUSHLEFT").apply( ([n, _]) => (stack, reg, dir) => {
	if (dir.value == 0) return
	stack.push(n)
})

//Pop a value from the stack and if its != 0, go left
let leftDir = mao.compile("GOLEFT").apply( () => (stack, reg, dir) => {
	if (stack.pop()) dir.value = 0
})

//Pop a value from the stack and if its != 0, go right
let rightDir = mao.compile("GORIGHT").apply( () => (stack, reg, dir) => {
	if (stack.pop()) dir.value = 1
})

//End the program
let stop = mao.compile("FINISH").apply( () => (stack, reg, dir) => {
	process.exit(0)
})

mao.addRules({
	NUMBER: number,
	WHITESPACE: whitespace,
	EYES: eyes,
	NOSES: noses,
	MOUTHS: mouths,
	LEFTFACE: leftFace,
	RIGHTFACE: rightFace,
	RIGHTPUSH: rightPush,
	LEFTPUSH: leftPush,
	LEFTDIR: leftDir,
	RIGHTDIR: rightDir,
	STOP: stop,
	E: "[{WHITESPACE}? [{LEFTFACE}|{RIGHTFACE}|{RIGHTPUSH}|{LEFTPUSH}|{LEFTDIR}|{RIGHTDIR}|{STOP}]]+",
	NOWTSP: "[{LEFTFACE}|{RIGHTFACE}|{RIGHTPUSH}|{LEFTPUSH}|{LEFTDIR}|{RIGHTDIR}|{STOP}]+",
	SIMPLE: "{WHITESPACE}? {RIGHTPUSH}",
})

stack = []
reg = {value: 0}
dir = {value: 0}
idx = 0
let program = mao.parse("(0_0)_1 X-D)( (0_0)_1 (>'-')> 1_(0_0) X-)) ;+D( (0_0)_5 (0_0)_2 :*) ;-) <('-'<) (0_0)_5 (0_0)_2 :*) X-O v('-')v", "E")
if (!program) console.log("Oops")
while (program) {
	if (idx < 0 || idx >= program.length) {
		throw new RangeError(idx)
	}
	program[idx](stack, reg, dir)
	idx += dir.value == 0 ? 1 : -1
}

/*

Emoticode Spec

1 Register
1 Stack

: (From Stack) ; (From Register) B (From Stdin) X (Null)
- (Subtract Inputs) ~ (Invert Input 1, discard input 2) + (Sum Inputs) * (Product of Inputs)
O (Print As Char) D (Print As Int) ) (To stack) ( (To Register)

<('-'<) (Pop && Go left)
(>'-')> (Pop && Go right)
v('-')v (Finish)

(0_0)_5 (Push value right)
5_(0_0) (Push value left)

*/
