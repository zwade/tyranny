
var execute = function(delayed) {
	if (delayed instanceof Array) {
		for (var i = 0; i < delayed.length; i++) {
			delayed[i] = execute(delayed[i])
		}
		var result = []
		for (var i = 0; i < delayed.length; i++) {
			if (delayed[i] != null) result.push(delayed[i])
		}
		return result
	} else if (delayed instanceof Function && delayed.delayed === true) {
		var [fn, original] = delayed()
		return fn(execute(original))
	} else {
		return delayed
	}
}

module.exports = execute
