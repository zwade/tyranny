var tokenizer = require("tokenizer2")
var readline = require("readline")

var tokens = {
	"string": /^('|").*\1$/,
	"openParen": /^\($/,
	"closeParen": /^\)$/,
	"pipe": /^->$/,
	"extract": /^=>$/,
	"whitespace": /^[ \t\n\r\b]+$/,
	"assignemnt": /^=$/,
	"variable": /^[a-zA-Z$_][a-zA-Z0-9$_]*$/
}

//t.on("token", (token, type) => console.log(token, type))

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	terminal: true
})

var denodeify = function(fn, that, ignore) {
	return (function(fn) {
		return function() {
			var args = []
			for (var i in arguments) {
				args[i] = arguments[i]
			}
			return new Promise(function(resolve, reject) {
				args.push(function(err, data) {
					if (err) {
						if (ignore) {
							resolve(err)
						} else {
							reject(err)
						}
					} else {
						resolve(data)
					}
				})
				fn.apply(that, args)
			})
		}
	})(fn)
}

var inquire = denodeify(rl.question, rl, true)

function loop() {
	var t = new tokenizer()

	for (var i in tokens) {
		t.addRule(tokens[i], i)
	}

	t.on("data", function() {console.log(arguments)})

	return inquire("> ").then(
		(d) => {t.write(d); t.end();loop()}) 
}

loop().catch(e => console.error("ERROR: "+e))
