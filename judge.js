var tokenizer = require("tokenizer2")
var readline = require("readline")
var deasync = require("deasync")

var judge = function() {
	this.tokens = {}
}

judge.prototype.register = function(tokens) {
	for (var i in tokens) {
		this.tokens[i] = tokens[i]
	}
}

judge.prototype.parse = function (string) {
		var t = new tokenizer()
		var that = this
		this.data = []
		for (var i in this.tokens) {
			t.addRule(this.tokens[i], i)	
		}
		var p = function(cb) {
			
			t.on("data", (data) => that.data.push(data))
			t.on("end", () => cb(null, that.data))
		}
		t.write(string)
		try {
			t.end()
		} catch (e) {
			console.error("Syntax Error")
			return []
		}
		return deasync(p)()
}

module.exports = judge
