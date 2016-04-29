
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
		if (inbounds(size, match) != 0) return false
		if (match.length != 1) return false
		if (match[0].type == token) return [match[0].src]
		return false
	}
	fn.size = size
	fn.idname = "TOKEN"
	return fn
}

var or = (...exps) => {
	var size = bounds(exps, Math.min, Math.max)
	var fn = (match) => {
		//console.log("Or", match)
		if (inbounds(size, match) != 0) return false
		for (var i = 0; i < exps.length; i++) {
			var test = exps[i](match)
			if (test) {
				var res = test[0]
				var tks = test[1]
				return test
			} 
		}
		return false
	}
	fn.size = size
	fn.idname = "OR"
	return fn
}

var and = (...exps) => {
	var size = bounds(exps, (a,b) => a+b, (a,b) => a+b)
	var fn = (match) => {
		//console.log("And", match)
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

		return bind(match, 0)

	}
	fn.size = size
	fn.idname = "AND"
	return fn
}

var group = (exp) => {
	var size = exp.size
	var fn = (match) => {
		var res = exp(match)
		if (res) {
			return [res]
		} else {
			return false
		}
	}
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
		var bind = (matches) => {
			if (matches.length == 0) return []
			for (var i = exp.size.min-1; i < Math.min(matches.length, exp.size.max); i++) {
				var args = matches.slice(exp.size.min-1, i+1)
				var res = exp(args)
				if (res) {
					var rest = bind(matches.slice(i+1))
					if (rest) {
						return (res).concat(rest)
					}
				}
			}
			return false
		}
		return bind(match)
	}
	fn.size = size
	fn.idname = "STAR"
	return fn
}


var grammar = function() {
	this.rules = {}
}

grammar.prototype.register = function(rules) {
	for (var i in rules) {
		this.rules[i] = rules[i]
	}
}

grammar.prototype.call = function(i, args) {
	if (! (i in this.rules)) return false
	return this.rules[i](args)
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
	var fn = (match) => this.rules[name](match)
	fn.size = size
	fn.idname = "EXPR"
	return fn
}

module.exports = {
	tok: tok,
	or: or,
	and: and,
	group: group,
}

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

