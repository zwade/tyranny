
var bounds = function(exps, mincomb, maxcomb) {

	if (exps.length == 0) {
		return {min: 0, max: 0}
	}
	var min = exps[0].size.min
	var max = exps[0].size.max
	for (var i = 1; i < exps.length; i++) {
		min = mincomb(min, exps[0].min)
		max = maxcomb(max, exps[0].max)
	}
	return {min: min, max: max}
}

var inbounds = function(bounds, match) {
	if (match.length < bounds.min) return -1
	if (match.length > bounds.max) return 1
	return 0
}

var tok = function(token) {
	size = {min: 1, max: 1}
	var fn = function(match, tokens) {
		if (inbounds(size, match) == 0) {
			if (match.length != 1) {
				return false
			}
			if (tokens.length != 0) {
				return false
			}
			if (match[0].type == token) {
				return [match[0].src]
			} else {
				return false
			}
		}
		if (tokens.length == 0 || inbounds(size, match) > 0) {
			return false
		} else {
			return fn(match.concat(tokens.slice(0,1)), tokens.slice(1))
		}
	}
	fn.size = size
	return fn
}

var or = function(...exps) {
	var size = bounds(exps, Math.min, Math.max)
	var fn = function(match, tokens) {
		if (inbounds(size, match) == 0) {
			for (var i = 0; i < exps.length; i++) {
				var test = exps[i]([], match)
				if (test) {
					return test
				} 
			}
		}
		if (tokens.length == 0 || inbounds(size, match) > 0) {
			return false
		} else {
			return fn(match.concat(tokens.slice(0,1)), tokens.slice(1))
		}
	}
	fn.size = size
	return fn
}

var and = function(...exps) {
	var size = bounds(exps, (a,b) => a+b, (a,b) => a+b)
	var fn = function (match, tokens) {
		if (inbounds(size, match) == 0) {

			var bind = function(matches, depth) {
				var e = exps[depth]
				if (depth == exps.length) return []
				if (matches.length == 0) return false

				for (var i = e.size.min-1; i < e.size.max; i++) {
					var args = matches.slice(i,i+1)
					var res = exps[depth]([], args) 
					if (res) {
						var rest = bind(matches.slice(i+1), depth+1)
						if (rest) {
							return ([res]).concat(rest)
						}
					}
				}
			}
			var res = bind(match, 0)
			if (res) {
				return res
			}
		}
		if (tokens.length == 0 || inbounds(size, match) > 0) {
			return false
		} else {
			return fn(match.concat(tokens.slice(0,1)), tokens.slice(1))
		}
	}
	fn.size = size
	return fn
}

var star = function(...exps) {
	var size = bounds(exps, () => 0, () => 1000)
	var fn = function (match, tokens) {
		
	}
}

var res = or(tok("hi"),and(tok("there"), tok("world"), tok("!")))

console.log(res([], [{type: "hi", src: "first!"}]))
console.log(res([], [{type: "there", src: "result"},{type: "world", src: "numero dos"},{type:"!", src: "!!!"}, {type: "?", src: "???"}])) 
console.log(res([], [{type: "there", src: "result"},{type: "world", src: "numero dos"}])) 
