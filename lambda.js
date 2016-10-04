var tyranny = require("./tyranny")
//var console = require("beautiful-log")
var readline = require("readline-sync")

var stalin = new tyranny.tyrant()
stalin.addTokens({
	"STRING": /^('|").*\1$/,
	"OPENPAREN": /^\($/,
	"CLOSEPAREN": /^\)$/,
	"PIPE": /^->$/,
	"EXTRACT": /^=>$/,
	"WHITESPACE": /^[ \t\n\r\b]+$/,
	"ASSIGNMENT": /^=$/,
	"VARIABLE": /^[a-zA-Z$_][a-zA-Z0-9$_]*$/,
	"NUMBER": /^[0-9]+$/,
	"DOT": /^\.$/,
})

var env = {
	log: console.log,
	file: (...a) => new hakkit.file(...a),
	tmp: {a: 1}
}

var wtsp = stalin.compile("WHITESPACE*").apply( () => null )
var open_paren = stalin.compile("OPENPAREN").apply( () => null )
var close_paren = stalin.compile("CLOSEPAREN").apply( () => null )
var num = tyranny.tok("NUMBER").apply( parseFloat )
var part = stalin.compile("{VARIABLE} DOT VARIABLE").apply( (l) => l[0][l[2]] )
var base = stalin.compile("VARIABLE").apply( (l) => env[l])
var vari = stalin.compile("{BASE}|{PART}").apply( (l) => l[0])
var str = tyranny.tok("STRING").apply( (d) => d.slice(1,-1) ) 
var arg = stalin.compile("{NUMBER}|{VARIABLE}|{STR}")
var delim = stalin.compile("WHITESPACE").apply( () => null )
var arg_list = stalin.compile("({ARG} [{DELIM} {ARG}]*)") 
var args = stalin.compile("{ARGLIST}|[{OPENPAREN} {WTSP} {ARGLIST} {WTSP} {CLOSEPAREN}]")
var call = stalin.compile("VARIABLE {WTSP} {ARGS}").apply( (l) => (env[l[0]])(...l[1]) )
var assign =  stalin.compile("VARIABLE {WTSP} ASSIGNMENT {WTSP} {E}").apply( (l) => env[l[0]] = l[2] )

stalin.addRules({
	NUMBER: num,
	PART: part,
	BASE: base,
	VARIABLE: vari,
	STR: str,
	WTSP: wtsp,
	ARG: arg,
	DELIM: delim,
	ARGLIST: arg_list,
	OPENPAREN: open_paren,
	CLOSEPAREN: close_paren,
	ARGS: args,
	CALL: call,
	ASG: assign,

	E: "{CALL}|{ASG}|{ARG}"
})


/*
stalin.parse('a = "hi"', "E")
stalin.parse('b = "quesadilla"', "E")
stalin.parse('log a "cheese" b', "E")
stalin.parse('log a', "E")
*/

while (true) {
	console.log(env)
	stalin.parse(readline.question("$ "), "E")
}
