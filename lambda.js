var tyranny = require("./tyranny")
var console = require("beautiful-log")
var eval = require("safe-eval")
var hakkit = require("hakkit")
var readline = require("readline-sync")
var path = require("path")
var deepcopy = require("deepcopy")

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

var file = function(p, ...r) {
	var fl
	var fpath = path.join(env ? env.dir : __dirname, p)
	if (r) {
		fl = new hakkit.file(fpath, ...r)
	} else {
		fl = new hakkit.file(fpath)
	}
	fl.repr = () => `File: ${fpath}`
	fl.extract = "tube"
	return fl
}

var env = {
	dir: __dirname,
	log: console.log,
	test: () => console.log("Test"),
	file: file,
	tmp: {a: 1, b: {c: 1}, f: (a) => `Hello ${a}`},
	f: file ("./lambda.js"),
	exit: process.exit,
}

var log = function(l) {
	console.log(l)
	return l
}

/*
 * Commented Code is the uncompiled version for testing
 * Uncommented Code is the compiled version which is much faster
 *
 */

/* Connector Tokens */

//var wtsp        = stalin.compile("WHITESPACE*")
var wtsp        = tyranny.star(tyranny.tok("WHITESPACE"))
                                .apply( () => null )
//var open_paren  = stalin.compile("OPENPAREN")
var open_paren  = tyranny.tok("OPENPAREN")
                                .apply( () => null )
//var close_paren = stalin.compile("CLOSEPAREN")
var close_paren = tyranny.tok("CLOSEPAREN")
                                .apply( () => null )
//var extract     = stalin.compile("EXTRACT")
var extract     = tyranny.tok("EXTRACT")
                                .apply( () => null )
//var delim       = stalin.compile("WHITESPACE")
var delim       = tyranny.tok("WHITESPACE")
                                .apply( () => null )

/* Literals & Variables */

//var num         = stalin.compile("NUMBER")
var num         = tyranny.tok("NUMBER")
                                .apply( (d) => (env) => parseFloat(d) )
//var part        = stalin.compile("{VARIABLE} {WTSP} EXTRACT {WTSP} VARIABLE")
var part        = tyranny.and(stalin.expr("VARIABLE"), stalin.expr("WTSP"), tyranny.tok("EXTRACT"), stalin.expr("WTSP"), tyranny.tok("VARIABLE"))
                                .apply( (l) => (env) => {
	var par = l[0](env)
	if (par.extract == "tube") {
		return (new hakkit.tube(par)).recv().toString()
	} else { 
		return par[l[2]] 
	}
})
//var base        = stalin.compile("VARIABLE")
var base        = tyranny.tok("VARIABLE")
                                .apply( (l) => (env) => {
	var e = env
	while (e[l] == undefined) {
		if (e == undefined) return undefined
		e = e._env
		if (e == undefined) return undefined
	}
	return e[l]
})
//var vari        = stalin.compile("{BASE}|{PART}")
var vari        = tyranny.or(stalin.expr("BASE"), stalin.expr("PART"))
                                .apply( (l) => (env) => l[0](env))
//var str         = stalin.compile("STRING")
var str         = tyranny.tok("STRING")
                                .apply( (d) => (env) => eval(d, env) ) 

/* Helpers */

//var arg         = stalin.compile("{NUMBER}|{VARIABLE}|{STR}|{E}")
var arg         = tyranny.or(stalin.expr("NUMBER"), stalin.expr("VARIABLE"), stalin.expr("STR"), stalin.expr("E"))
//var arg_list    = stalin.compile("({ARG} [{DELIM} {ARG}]*)") 
var arg_list    = tyranny.group(tyranny.and(stalin.expr("ARG"), tyranny.star(tyranny.and(stalin.expr("DELIM"), stalin.expr("ARG")))))
//var args        = stalin.compile("{ARGLIST}|[{OPENPAREN} {CLOSEPAREN}]")
var args        = tyranny.or(stalin.expr("ARGLIST"), tyranny.and(stalin.expr("OPENPAREN"), stalin.expr("CLOSEPAREN")))

/* Actions */

//var call        = stalin.compile("{VARIABLE} {WTSP} {ARGS}")
var call        = tyranny.and(stalin.expr("VARIABLE"), stalin.expr("WTSP"), stalin.expr("ARGS"))
                                .apply( (l) => (env) => {
	var fn   = l[0](env)
	var args = []
	for (var i in l[1]) {
		args[i] = l[1][i](env)
	}
	if (typeof fn != "function") {
		console.error("Trying to call non-function: ", fn)
		return []
	}
	if (args == undefined) {
		return fn()//.apply(that, [])
	} else {
		return fn(...args)//.apply(that, l[1]) 
	}
})
//var assign      = stalin.compile("(VARIABLE [{WTSP} {EXTRACT} {WTSP} VARIABLE]*) {WTSP} ASSIGNMENT {WTSP} {E}")
var assign      = tyranny.and(tyranny.group(tyranny.and(tyranny.tok("VARIABLE"), 
			                                tyranny.star(tyranny.and(stalin.expr("WTSP"), stalin.expr("EXTRACT"), stalin.expr("WTSP"), tyranny.tok("VARIABLE"))))), 
		              stalin.expr("WTSP"), tyranny.tok("ASSIGNMENT"), stalin.expr("WTSP"), stalin.expr("E")) 
                                .apply( (l) => (env) => {
	var e = env
	for (var i = 0; i < l[0].length-1; i++) {
		e = e[l[0][i]]
	}
	var val = l[2](env)
	e[l[0][l[0].length-1]] = val
	return val
})

// Scope's broke yo
// JK not anymore

//var fun         = stalin.compile("[[{OPENPAREN} {WTSP} {CLOSEPAREN}]|[{OPENPAREN} (VARIABLE [{WTSP} VARIABLE]*) {CLOSEPAREN}]] {WTSP} {EXTRACT} {WTSP} {E}")
var fun         = tyranny.and( tyranny.or( tyranny.and( stalin.expr("OPENPAREN"), stalin.expr("WTSP"), stalin.expr("CLOSEPAREN") ), 
					   tyranny.and( stalin.expr("OPENPAREN"), tyranny.group( tyranny.and( tyranny.tok("VARIABLE"), 
					                tyranny.star( tyranny.and( stalin.expr("WTSP"), tyranny.tok("VARIABLE"))))), stalin.expr("CLOSEPAREN"))),
			       stalin.expr("WTSP"), stalin.expr("EXTRACT"), stalin.expr("WTSP"), stalin.expr("E"))
                                .apply( (l) => (env) => {
	var nenv = deepcopy(env)
	var fn = (...args) => {
		thenv = {}
		thenv._env = nenv
		if (l.length == 1) return l[0](thenv)
		for (var i = 0; i < l[0].length; i++) {
			thenv[l[0][i]] = args[i]
		}
		var result = l[1](thenv)
		return result
	}
	fn.repr = () =>  "[Function ("+ (l.length > 1 ? l[0].join(" ") : "") + ")]"
	return fn
})

stalin.addRules({
	NUMBER: num,
	EXTRACT: extract,
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
	FUN: fun,
	ASG: assign,

	E: "{CALL}|{ASG}|{ARG}|{FUN}|[{OPENPAREN} {WTSP} {E} {WTSP} {CLOSEPAREN}]"
})

while (true) {
	var out = stalin.parse(readline.question("$ "), "E")
	if (out == false) {
		console.log("Grammar Error")
	} else {
		var out = out[0](env)
		if (out && out.repr) {
			console.log(out.repr())
		} else {
			console.log(out)
		}
	}
}
