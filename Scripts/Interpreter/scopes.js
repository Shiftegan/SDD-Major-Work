//Function to recursively search through a list to set value at a list of indexes
var setAtIndex = function(variable, indexes, value){
	if(indexes[0] >= variable.length){
		throw("Index Error: Invalid Index")
	}
	if(!(variable instanceof Array)){
		throw("Type Error: Cannot index non-iterable object")
	}
	if (indexes.length > 1){
		setAtIndex(variable[indexes[0]], indexes.slice(1), value)
	} else {
		variable[indexes[0]] = value
	}
}

//Variable object: stores name, value and type
var V = function(name, value, type){
	this.name = name
	this.type = type
	this.value = value
}

//Scope object: stores variables
var Scope = function(superscope){
	if(superscope){
		this.superscope = superscope
	}
	//Define built in functions
	this.variables = {
		"range":new V("range", function(num){return Array.apply(null, Array(num)).map(function (_, i) {return i})}, "function"),
		"len":new V("len", function(iter){return iter.length}, "function"),
		"int":new V("int", function(x){return Math.floor(x)}, "function"),
		"str":new V("str", function(x){return String(x)}, "function"),
		"bool": new V("bool", function(x){return Boolean(x)}, "function"),
		"float": new V("float", function(x){return parseFloat(x)}, "function")}

	//Look for variable by name in scope and super-scope
	this.lookup = function(name){
		//Check current scope
		if(name in this.variables){
			return this.variables[name]
		//Check Parent Scope
		} else if(this.superscope){
			return this.superscope.lookup()
		}
		//Failed to find
		return false
	}

	//Set a variable: if its not found assign it
	this.set = function(name, value, indexes){
		v = this.lookup(name)
		if(indexes){
			if(v){setAtIndex(v.value, indexes, value)}
		} else if(v) {
			v.value = value
		} else { 
			this.assign(name, value)
		}

	}

	//Assign a new variable
	this.assign = function(name, value, type){
		this.variables[name] = new V(name, value, type)
	}
}