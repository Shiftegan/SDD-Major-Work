//Tests if an object is the right type e.g. 1.2 is a number
var num = function(n){return typeof(n) == "number"}
var str = function(s){return typeof(s) == "string"}
var list = function(l){return typeof(l) == "object"}
var funct = function(f){return typeof(f) == "function"}
var int = function(i){return Math.floor(i) == i}

//Intepreter object that visits the AST
var Interpreter = function(grid){
	this.grid = grid
	this.crashed = false
	this.GLOBAL_SCOPE = new Scope()

	//Throw an error
	this.error = function(call, line){
		markers.push(editor.session.addMarker(new Range(line, 0, line, 1), "error", "fullLine"))
		throw(call)
	}

	//Chheck if an item is of a certain type and then throw an error if it is not
	this.assert = function(f, data, line, e){
		if(f(data)){
			return true
		} else {
			this.error("Type Error: " + e, line)
		}
	}

	//Take a node and call the correct visit_ function
	this.visit = function(node){
		return this["visit_" + node.constructor.name](node)
	}

	//Visit a unary operator node e.g. (-)3
	this.visit_UnaryOp = function(node){
		switch(node.op.type){
			case PLUS:
				item = this.visit(node.expr)
				this.assert(num, item, node.line, "Cannot force non-numerical value to be positive")
				this.grid.stack.operate(1, +item, "+")
				return +item
			case MINUS:
				item = this.visit(node.expr)
				this.assert(num, item, node.line, "Cannot force non-numerical value to be negative")
				this.grid.stack.operate(1, -item, "-")
				return -item
			case NOT:
				item = this.visit(node.expr)
				this.grid.stack.operate(1, !item, "not")
				return !item
		}
	}

	//Visit a binary operator e.g. +, -, *, /
	this.visit_BinOp = function(node){
		var result = 0
		switch(node.op.type){
			case PLUS:
				var left = this.visit(node.left)
				var right = this.visit(node.right)
				if(typeof(left) == "string"){
					this.assert(str, right, node.line, "Cannot add string and non-string")
				} else if(typeof(left) == "number") {
					this.assert(num, right, node.line, "Cannot add non-numerical values")
				} else {
					this.error("Type Error: Cannot add non-numerical values", node.line)
				}
				result = left + right
				this.grid.stack.operate(2, result, "+")
				return result
			case MINUS:
				var left = this.visit(node.left)
				var right = this.visit(node.right)
				this.assert(num, left, node.line, "Cannot subtract non-numerical values")
				this.assert(num, right, node.line, "Cannot subtract non-numerical values")
				result = left - right
				this.grid.stack.operate(2, result, "-")
				return result
			case MUL:
				var left = this.visit(node.left)
				var right = this.visit(node.right)
				if(typeof(left) == "string"){
					this.assert(num, right, node.line, "Cannot multiply string by non-numerical value")
				} else if(typeof(right) == "number") {
					this.assert(num, right, node.line, "Cannot multiply non-numerical values")
				} else {
					this.error("Type Error: Cannot multiply non-numerical values", node.line)
				}
				result = left * right
				this.grid.stack.operate(2, result, "*")
				return result
			case DIV:
				var left = this.visit(node.left)
				var right = this.visit(node.right)
				this.assert(num, left, node.line, "Cannot divide non-numerical values")
				this.assert(num, right, node.line, "Cannot divide non-numerical values")
				result = left / right
				this.grid.stack.operate(2, result, "/")
				return result
		}
	}

	//Visit a comparison node e.g. ==, >, <
	this.visit_Comparison = function(node){
		var result = 0
		switch(node.op.type){
			case LESS_THAN:
				result = this.visit(node.left) < this.visit(node.right)
				this.grid.stack.operate(2, result, "<")
				return result
			case GREATER_THAN:
				result = this.visit(node.left) > this.visit(node.right)
				this.grid.stack.operate(2, result, ">")
				return result
			case EQUAL:
				result = this.visit(node.left) == this.visit(node.right)
				this.grid.stack.operate(2, result, "==")
				return result
			case NOT_EQUAL:
				result = this.visit(node.left) != this.visit(node.right)
				this.grid.stack.operate(2, result, "!=")
				return result
			case AND:
				result = Boolean(this.visit(node.left) && this.visit(node.right))
				this.grid.stack.operate(2 , result, "and")
				return result
			case OR:
				left = this.visit(node.left)
				right = this.visit(node.right)
				result = Boolean(left || right)
				this.grid.stack.operate(2, result, "or")
				return result
		}
	}

	//Visit if statement: if condition is true visit indented lines
	this.visit_If_Statement = function(node){
		var result = this.visit(node.condition)
		this.grid.stack.pull()
		if(result){
			this.visit(node.statements)
		}
		
	}

	//Visit while loop: while condition is true visit indented lines
	this.visit_While_Loop = function(node){
		var result = this.visit(node.condition)
		this.grid.stack.pull()
		while(result){
			this.visit(node.statements)
			result = this.visit(node.condition)
			this.grid.stack.pull()
		}
	}

	//Visit for loop: for each item in iterable assign it to given variable
	this.visit_For_Loop = function(node){
		var iterable = this.visit(node.iter)
		var var_name = node.id.value
		for(var i = 0; i < iterable.length; i++){
			this.grid.stack.getindex(i, true)
			this.grid.stack.set(this.grid.variables[var_name])
			this.GLOBAL_SCOPE.set(var_name, iterable[i])
			this.visit(node.statements)
		}
	}

	//Visit compound statement: visit each of the children nodes
	this.visit_Compound = function(node){
		for(var i = 0; i < node.children.length; i++){
			this.visit(node.children[i])
		}
	}

	//Visit number: push it to stack
	this.visit_Num = function(node){
		//console.log("Found: " + node.value)
		this.grid.stack.push(new G_Value(node.value))
		return node.value
	}

	//Visit string: push it to stack
	this.visit_Str = function(node){
		this.grid.stack.push(new G_Value(node.value))
		return node.value
	}

	//Visit boolean: push it to stack
	this.visit_Bool = function(node){
		this.grid.stack.push(new G_Value(node.value))
		return node.value
	}

	//Visit index: visit child and then attempt to get value at given index, push it to stack
	this.visit_Index = function(node){
		var value = this.visit(node.left)
		this.assert(list, value, node.line, "Cannot index non-iterable object")
		var index = this.visit(node.index)
		this.assert(int, index, node.line, "Index cannot be a non-integer value")
		this.grid.stack.pull()
		this.grid.stack.getindex(index)
		return value[index]
	}

	//Visit function call: visist node and call function, push result to stack
	this.visit_Call = function(node){
		var value = this.visit(node.left)
		this.assert(funct, value.value, node.line, "Cannot call non-function")
		var inp = this.visit(node.right)
		var results = value.value(...inp)
		this.grid.stack.operate(1, results, value.name + "()")
		return results
	}

	//Visit list definition: visit sub-values and collapse into a list
	this.visit_List = function(node){
		var values = []
		for (var i = 0; i < node.expr.length; i++){
			var v = this.visit(node.expr[i])
			values.push(v)
		}
		this.grid.stack.operate(node.expr.length, values, "[]")
		return values
	}

	//Visit empty line: do nothing
	this.visit_NoOp = function(node){}

	//Recursively look through index objects to generate list of indexes
	this.look = function(current){
		current = current.left
		if(current instanceof Index){
			var results = this.look(current)
			results[1].push(this.visit(current.index))
			this.grid.stack.pull()
			return results
		} else {
			return [current.value,[]]
		}
	}

	//Visit assignment statement: Assign a variable with a value
	this.visit_Assign = function(node){
		//If its an index generate a list of indexes, then set the value at that set indexes
		if(node.left instanceof Index){
			var result = this.look(node)
			try{this.GLOBAL_SCOPE.set(result[0], this.visit(node.right), result[1])}
			catch(e){this.error(e, node.line)}
			this.grid.stack.set(this.grid.variables[result[0]], result[1])
		//If its a variable just assign it
		} else if (node.left instanceof Var){
			var var_name = node.left.value
			this.GLOBAL_SCOPE.set(var_name, this.visit(node.right))
			this.grid.stack.set(this.grid.variables[var_name])
		} else {
			this.error("Syntax Error: Cannot assign to non-variable item", node.line)
		}
	}

	//Visit variable reference: Find variable's value and return it
	this.visit_Var = function(node){
		var var_name = node.value
		var val = this.GLOBAL_SCOPE.lookup(var_name)
		if(val && val.type == "function"){
			return val
		} else if (val){
			this.grid.stack.get(this.grid.variables[val.name])
			return val.value
		} else {
			this.error("Name Error: " + var_name + " does not exist", node.line)
		}
	}
}
