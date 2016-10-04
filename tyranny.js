var readline = require("readline")
var judge = require("./government/judge")
var jury = require("./government/jury")
var executer = require("./government/executioner")

var judy = new judge()
var peers = new jury.grammar()

var or = jury.or
var and = jury.and
var star = jury.star
var tok = jury.tok
var none = jury.none 
var group = jury.group

var tyrant = function(debug = false) {
	this.debug = debug
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
		closeBrace: /^\}$/,
	        question: /^\?$/,
		falsey: /^\&NONE$/,
		plus: /^\+$/,
	}

	var alternation = and( this.peers.expr("E"), tok("alternate"), this.peers.expr("E") ).apply( (l) => or(l[0],l[2]) ) 
	var concat = and( this.peers.expr("E"), tok("concat"), this.peers.expr("E") ).apply( (l) => and(l[0], l[2]))
	var starv = and( this.peers.expr("E"), tok("star") ).apply( (l) => star(l[0]))
	var expr = and( tok("openBrace"), tok("token"), tok("closeBrace") ).apply( (l) => that.grand.expr(l[1]) ) 
	var tokn = tok("token").apply( (t) => tok(t))
	var grp = and( tok("openParen"), this.peers.expr("E"), tok("closeParen") ).apply( (l) => group(l[1]) )
	var lg = and( tok("openBracket"), this.peers.expr("E"), tok("closeBracket") ).apply( (l) => l[1] )
	var empty = tok("falsey").apply( (_) => none())
	var maybe = and( this.peers.expr("E"), tok("question") ).apply( (l) => or(none(), l[0]) )
	var atleast = and( this.peers.expr("E"), tok("plus") ).apply( (l) => and(l[0], star(l[0])) )

	var grammars = {
		E: or(tokn, grp, alternation, concat, starv, expr, lg, empty, maybe, atleast)
	}

	this.judy.register(tokens)
	this.peers.register(grammars)

}

tyrant.prototype.addTokens = function(ts) {
	this.joebrown.register(ts)
}

tyrant.prototype.compile = function(str) {
	var d = this.judy.parse(str)
	if (d === null) throw new SyntaxError("Invalid Grammar Description")
	let grammar = this.peers.call("E", d, false)
	let ded = executer(grammar)[0]
	return ded
}

tyrant.prototype.addRules = function(rules) {
	for (var name in rules) {
		var rule = rules[name]
		if (typeof rule == "string") rules[name] = this.compile(rule)
	}
	this.grand.register(rules)
}

tyrant.prototype.parse = function(str, rule) {
	if (this.debug) {
		let now = Date.now()
		var d = this.joebrown.parse(str)
		console.log(`Lex Time: ${Date.now()-now}`)
		if (d === null) throw new SyntaxError("Invalid Syntax")
		if (rule != undefined) {
			now = Date.now()
			let grammar = this.grand.call(rule, d)
			console.log(`Grammar Parse Time: ${Date.now()-now}`)
			console.log(`Counts: ${this.grand.count}`)
			now = Date.now()
			let result =  executer(grammar)
			console.log(`Execution Time: ${Date.now()-now}`)
			return result
		} else {
			now = Date.now()
			let grammar = this.grand.callAny(d)
			console.log(`Grammar Parse Time: ${Date.now()-now}`)
			console.log(`Counts: ${this.grand.count}`)
			now = Date.now()
			let result = executer(grammar)
			console.log(`Execution Time: ${Date.now()-now}`)
			return result
		}
	} else {
		var d = this.joebrown.parse(str)
		if (d === null) throw new SyntaxError("Invalid Syntax")
		if (rule != undefined) {
			let grammar = this.grand.call(rule, d)
			return executer(grammar)
		} else {
			return executer(this.grand.callAny(d))
		}
	}
}

module.exports = {
	tyrant: tyrant,
	or: or,
	and: and,
	group: group,
	star: star,
	tok: tok,
	executer: executer
}

