class tokenizer {
	constructor (tokens = {}) {
		this.tokens = tokens
		this.memoization = new Map()
	}
	tokenizeRecursively(string) {
		if (string.length == 0) {
			return []
		}
		if (this.memoization.has(string)) {
			return this.memoization.get(string)
		}
		for (let i = string.length; i >= 0; i--) {
			let testStr = string.slice(0, i)
			let remainder = string.slice(i)
			for (let token in this.tokens) {
				let match = this.tokens[token].exec(testStr)
				if (match) {
					try {
						this.memoization.set(string, null)
						let recurse = this.tokenizeRecursively(remainder)
						this.memoization.delete(string)
						if (recurse === null) continue

						let duped = recurse.slice()
						duped.push({src:match[0], type:token})
						this.memoization.set(string, duped)
						return duped
					} catch (e) {
						if (e instanceof RangeError) {
							continue
						} else {
							throw e
						}
					}
				}
			}
		}
		throw new RangeError
	}
	parse(string) {
		try {
			let result = this.tokenizeRecursively(string)
			return result.reverse()
		} catch (e) {
			if (e instanceof RangeError) {
				return null
			} else {
				throw e
			}
		}
	}
	register(tokens) {
		for (let token in tokens) {
			this.tokens[token] = tokens[token]
		}
	}
}

module.exports = tokenizer
