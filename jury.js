var console = require("beautiful-log")

var bounds = function(exps, mincomb, maxcomb) {

	if (exps.length == 0) {
		return {min: 0, max: 0}
	}
	var min = exps[0].size.min
	var max = exps[0].size.max
	for (var i = 1; i < exps.length; i++) {
		min = mincomb(min, exps[i].size.min)
		max = maxcomb(max, exps[i].size.max)
	}
	return {min: min, max: max}
}

var inbounds = function(bounds, match) {
	if (match.length < bounds.min) return -1
	if (match.length > bounds.max) return 1
	return 0
}

var tok = (token) => {
	size = {min: 1, max: 1}
	var fn = (match) => {
		//console.log("Tok", match, token)
		if (inbounds(size, match) != 0) return false
		if (match.length != 1) return false
		if (match[0].type == token) {
			var delay = () => [fn.app, match[0].src]
			delay.delayed = true
			return [delay]
		}
		return false
	}
	fn.app = (x) => x
	fn.apply = (f) => {fn.app = f; return fn}
	fn.size = size
	fn.idname = "TOKEN"
	return fn
}

var or = (...exps) => {
	var size = bounds(exps, Math.min, Math.max)
	var fn = (match) => {
		//console.log("Or", match, exps, "\n")
		if (inbounds(size, match) != 0) return false
		for (var i = 0; i < exps.length; i++) {
			var test = exps[i](match)
			if (test) {
				if (fn.app) {
					var delay = () => [fn.app, test]
					delay.delayed = true
					return [delay]
				} else {
					return test
				}
			} 
		}
		return false
	}
	fn.apply = (f) => {fn.app = f; return fn}
	fn.size = size
	fn.idname = "OR"
	return fn
}

var and = (...exps) => {
	var size = bounds(exps, (a,b) => a+b, (a,b) => a+b)
	var fn = (match) => {
		//console.log("And", match, exps, "\n")
		if (inbounds(size, match) != 0) return false
		var bind = (matches, depth) => {
			var e = exps[depth]
			if (depth >= exps.length-1) return exps[depth](matches)

			for (var i = e.size.min; i <= Math.min(matches.length, e.size.max); i++) {
				var args = matches.slice(0,i)
				var res = exps[depth](args) 
				if (res) {
					var rest = bind(matches.slice(i), depth+1)
					if (rest) {
						return (res).concat(rest)
					}
				}
			}
			return false
		}
		var out =  bind(match, 0)
		if (!out) return false
		if (fn.app) {
			var delay = () => [fn.app, out]
			delay.delayed = true
			return [delay]
		} else {
			return out
		}

	}
	fn.apply = (f) => {fn.app = f; return fn}
	fn.size = size
	fn.idname = "AND"
	return fn
}

var group = (exp) => {
	var size = exp.size
	var fn = (match) => {
		var res = exp(match)
		if (res) {
			var delay = () => [fn.app, res]
			delay.delayed = true
			return [delay]
		} else {
			return false
		}
	}
	fn.app = (x) => x
	fn.apply = (f) => {fn.app = f; return fn}
	fn.size = size
	fn.idname = "GROUP"
	return fn
}

var star = (exp) => {
	var size = {
		min: 0,
		max: 1000,
	}
	var fn = (match) => {
		//console.log("Star: ",match, exp, "\n")
		var bind = (matches) => {
			if (matches.length == 0) return []
			for (var i = exp.size.min; i <= Math.min(matches.length, exp.size.max); i++) {
				var args = matches.slice(0, i)
				var res = exp(args)
				if (res) {
					var rest = bind(matches.slice(i))
					if (rest) {
						return (res).concat(rest)
					}
				}
			}
			return false
		}
		var out = bind(match)
		if (!out) return false
		if (fn.app) {
			var delay = () => [fn.app, out]
			delay.delayed = true
			return [delay]
		} else {
			return out
		}
	}
	fn.apply = (f) => {fn.app = f; return fn}
	fn.size = size
	fn.idname = "STAR"
	return fn
}

var stringify = function(match) {
	var str = ""
	if (match.length == 0) return ">EPSILON<"
	for (var i = 0; i < match.length-1; i++) {
		str += match[i].type + "|"
	}
	str += match[match.length-1].type
	for (var i = 0; i < match.length; i++) {
		str += match[i].src
	}
	return str
}

var grammar = function() {
	this.rules = {}
	this.memos = {}
}

grammar.prototype.register = function(rules) {
	for (var i in rules) {
		this.rules[i] = rules[i]
		this.memos[i] = {}
	}
}

grammar.prototype.call = function(i, args, memoize) {
	if (memoize != undefined) this.memoize = memoize
	if (! (i in this.rules)) return false
	if (stringify(args) in this.memos[i]) return this.memos[i][stringify(args)]
	return this.rules[i](args)
}

grammar.prototype.callAny = function(args, memoize) {
	if (memoize != undefined) this.memoize = memoize
	for (var i in this.rules) {
		var test = this.call(i, args)
		if (test != false) return test
	}
	return false
}

grammar.prototype.expr = function (name) {
	var size; 
	if (this.rules[name]) {
		size = this.rules[name].size
	} else {
		size = {
			min: 0,
			max: 1000,
		}
	}
	var fn = (match) => {
		//console.log("Expr", name, match)
		var str = stringify(match)
		if (this.memos[name] == undefined) {
			console.log("Can't Access "+name)
			return false
		}
		if (this.memos[name][str] === false) return false
		if (this.memoize != false && this.memos[name][str] != undefined) {
			return this.memos[name][str]
		} else {
			this.memos[name][str] = false
			var out = this.rules[name](match)
			this.memos[name][str] = out
			return out
		}
	}
	fn.size = size
	fn.idname = "EXPR"
	return fn
}

module.exports = {
	tok: tok,
	or: or,
	and: and,
	group: group,
	star: star,
	grammar: grammar,
}

/*
var lambda = new grammar()
lambda.register({
	X: tok("string"),
	E: or(and(tok("L"), lambda.expr("X"), tok("."), lambda.expr("E")),
	      and(tok("("), lambda.expr("E"), lambda.expr("E"), tok(")")),
	      lambda.expr("X"))
})

console.log(lambda.call("E", 
	[{type: "L", src: "L"}, {type: "string", src: "hi there"}, {type: ".", src: "."}, {type: "string", src: "fin"}]))

console.log(lambda.call("E", 
	[{type: "L", src: "L"}, {type: "string", src: "hi there"}, {type: ".", src: "."},
	{type: "(", src: "("}, {type: "string", src: "inner"}, {type: "string", src: "string"}, {type: ")", src: ")"}]))

/*
var t = new grammar()

var world = group(or(tok("hello"), and(tok("w"),tok("o"), tok("rld"))))
var res = or(tok("hi"),and(tok("there"), star(world), tok("!"), t.expr("BOO")))
t.register({res: res})
console.log(t.call("res", [{type: "there", src: "result"},{type: "w", src: "is"},{type: "o", src: "it"},{type: "rld", src: "work"},{type:"!", src: "!!!"}]))

console.log(res([{type: "hi", src: "first!"}]))
console.log(res([{type: "there", src: "result"},{type: "hello", src: "numero dos"},{type:"!", src: "!!!"}])) 
console.log(res([{type: "there", src: "result"},{type:"!", src: "!!!"}])) 
console.log(res([{type: "there", src: "result"},{type: "w", src: "is"},{type: "o", src: "it"},{type: "rld", src: "work"},{type:"!", src: "!!!"}])) 
console.log(res([{type: "there", src: "result"},{type: "hello", src: "yay"}, {type: "w", src: "is"},{type: "o", src: "it"},{type: "rld", src: "work"},{type: "hello", src: "wee"}, {type:"!", src: "!!!"}])) 
console.log(res([{type: "there", src: "result"},{type: "w", src: "is"},{type: "o", src: "it"},{type: "rld", src: "work"},{type: "?", src: "wut"}, {type:"!", src: "!!!"}])) 
console.log(res([{type: "there", src: "result"},{type: "w", src: "is"},{type: "o", src: "it"},{type: "rld", src: "work"},{type: "!", src: "!!!"}, {type: "?", src: "wut"}])) 
console.log(res([{type: "there", src: "result"},{type: "world", src: "numero dos"}])) 
*/

