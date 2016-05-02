var tokenizer = require("tokenizer2")
var readline = require("readline")
var judge = require("./judge")
var jury = require("./jury")
var executer = require("./executioner")

var judy = new judge()
var peers = new jury.grammar()

var or = jury.or
var and = jury.and
var star = jury.star
var tok = jury.tok
var group = jury.group

/*
var tokens = {
	"string": /^('|").*\1$/,
	"openParen": /^\($/,
	"closeParen": /^\)$/,
	"pipe": /^->$/,
	"extract": /^=>$/,
	"whitespace": /^[ \t\n\r\b]+$/,
	"assignment": /^=$/,
	"variable": /^[a-zA-Z$_][a-zA-Z0-9$_]*$/,
	"number": /^[0-9]+$/,
}

//Helpers

var literal = or(tok("number"), tok("variable"), tok("string"))
var wtsp = star(tok("whitespace")).apply(() => null)
var arg = literal
var arg_list = group(and(arg, star(and(tok("whitespace").apply(() => null), arg)))) 
var args = or(arg_list, and(tok("openParen").apply(() => null), wtsp, arg_list, wtsp, tok("closeParen").apply(() => null)))

var grammars = {
	CALL: and(tok("variable"), wtsp, args),
	ASG: and(tok("variable"), wtsp, tok("assignment"), wtsp, literal)
}
*/

var tyrant = function() {
	this.judy = new judge()
	this.peers = new jury.grammar()

	this.joebrown = new judge()
	this.grand = new jury.grammar()
	var that = this

	var tokens = {
		openParen: /^\($/,
		closeParen: /^\)$/,
		alternate: /^\|$/,
		concat: /^\ $/,
		star: /^\*$/,
		token: /^[a-zA-Z_]+$/,
		openBracket: /^\[$/,
		closeBracket: /^\]$/,
		openBrace: /^\{$/,
		closeBrace: /^\}$/
	}

	var alternation = and( this.peers.expr("E"), tok("alternate"), this.peers.expr("E") ).apply( (l) => or(l[0],l[2]) ) 
	var concat = and( this.peers.expr("E"), tok("concat"), this.peers.expr("E") ).apply( (l) => and(l[0], l[2]))
	var star = and( this.peers.expr("E"), tok("star") ).apply( (l) => star(l[0]))
	var expr = and( tok("openBrace"), tok("token"), tok("closeBrace") ).apply( (l) => that.grand.expr(l[1]) ) 
	var tokn = tok("token").apply( (t) => tok(t) )
	var grp = and( tok("openParen"), this.peers.expr("E"), tok("closeParen") ).apply( (l) => group(l[1]) )
	var lg = and( tok("openBracket"), this.peers.expr("E"), tok("closeBracket") ).apply( (l) => l[1] )

	var grammars = {
		E: or(tokn, grp, alternation, concat, star, expr, lg)
	}

	this.judy.register(tokens)
	this.peers.register(grammars)

}

tyrant.prototype.addTokens = function(ts) {
	this.joebrown.register(ts)
}

tyrant.prototype.compile = function(str) {
	var d = this.judy.parse(str)
	return executer(this.peers.call("E", d))[0]
}

tyrant.prototype.addRules = function(rules) {
	for (var name in rules) {
		var rule = rules[name]
		if (typeof rule == "string") rules[name] = this.compile(rule)
	}
	this.grand.register(rules)
}

tyrant.prototype.parse = function(str, rule) {
	var d = this.joebrown.parse(str)
	if (rule != undefined) {
		return executer(this.grand.call(rule, d))
	} else {
		return executer(this.grand.callAny(d))
	}
}

module.exports = {
	tyrant: tyrant,
	or: or,
	and: and,
	group: group,
	star: star,
	token: tok,
	executer: executer
}

