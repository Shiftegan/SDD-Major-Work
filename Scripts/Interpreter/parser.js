//Define a bunch of nodes for each operation storing the line they occured on
var BinOp = function(left, op, right, line){
	this.left = left
	this.token = op
	this.op = op
	this.right = right
	this.line = line
}

var UnaryOp = function(op, expr, line){
	this.token = op
	this.op = op
	this.expr = expr
	this.line = line
}

var Num = function(token, line){
	this.token = token
	this.value = token.value
	this.line = line
}

var Str = function(token, line){
	this.token = token
	this.value = token.value
	this.line = line
}

var Bool = function(token, line){
	this.token = token
	if(token.value == "False"){
		this.value = false
	} else {
		this.value = true
	}
	this.line = line
}

var Compound = function(line){
	this.children = []
	this.line = line
}

var Assign = function(left, op, right, line){
	this.left = left
	this.token = op
	this.op = op
	this.right = right
	this.line = line
}

var Comparison = function(left, op, right, line){
	this.left = left
	this.token = op
	this.op = op
	this.right = right
	this.line = line
}

var Var = function(token, line){
	this.token = token
	this.value = token.value
	this.line = line
}

var Index = function(node, index, line){
	this.left = node
	this.index = index
	this.line = line
}

var Call = function(node, right, line){
	this.left = node
	this.right = right
	this.line = line
}

var List = function(expressions, line){
	this.expr = expressions
	this.line = line
}

var If_Statement = function(token, condition, statements, line){
	this.token = token
	this.condition = condition
	this.statements = statements
	this.line = line
}

var While_Loop = function(token, condition, statements, line){
	this.token = token
	this.condition = condition
	this.statements = statements
	this.line = line
}

var For_Loop = function(token, id, iter, statements, line){
	this.token = token
	this.id = id
	this.iter = iter
	this.statements = statements
	this.line = line
}

var NoOp = function(){}

//Parser object that converts token into an AST
var Parser = function(lexer){
	this.lexer = lexer
	this.values = []
	this.current_token = this.lexer.get_next_token()
	this.current_line = 0

	//Process a list
	this.list = function(){
		var node = this.comparison()
		if(node){
			var results = [node]
			//While there are comma deliminated items add them to the list
			while (this.current_token.type == COMMA){
				this.eat(COMMA)
				node = this.comparison()
				results.push(node)
			}
		} else {
			var results = []
		}
		//Return list objects
		return new List(results, this.current_line)
	}

	//Lowest level term: a basic data type, operation or another set of terms in brackets
	this.factor = function(){
		var token = this.current_token
		var node = undefined
		//Check which type of token it is and process the corresponding tokens
		switch(token.type){
			case LSQUARE:
				this.eat(LSQUARE)
				node = this.list()
				this.eat(RSQUARE)
				break
			case NUMBER:
				this.eat(NUMBER)
				node = new Num(token, this.current_line)
				break
			case STR:
				this.eat(STR)
				node = new Str(token, this.current_line)
				break
			case BOOL:
				this.eat(BOOL)
				node = new Bool(token, this.current_line)
				break
			case LPAREN:
				this.eat(LPAREN)
				node = this.comparison()
				this.eat(RPAREN)
				break
			case PLUS:
				this.eat(PLUS)
				node =  new UnaryOp(token, this.expr(), this.current_line)
				break
			case MINUS:
				this.eat(MINUS)
				node = new UnaryOp(token, this.expr(), this.current_line)
				break
			case NOT:
				this.eat(NOT)
				node = new UnaryOp(token, this.expr(), this.current_line)
				break
			case ID:
				node = this.variable()
				break
		}
		//While there are square brackets turn the node into a subnode of an index
		//While there are normal brackets turn the node into a subnode of a function call
		while (this.current_token.type == LSQUARE || this.current_token.type == LPAREN){
			if(this.current_token.type == LSQUARE){
				this.eat(LSQUARE)
				var index = this.expr()
				this.eat(RSQUARE)
				node = new Index(node, index, this.current_line)
			} else {
				this.eat(LPAREN)
				var right = this.list()
				this.eat(RPAREN)
				node = new Call(node, right, this.current_line)
			}
		}

		return node
	}

	//Second lowest level item: Consists of multiplication or division
	this.term = function(){
		var node = this.factor()
		while (this.current_token.type == MUL || this.current_token.type == DIV){
			var token = this.current_token
            if (token.type == MUL){
                this.eat(MUL)
            } else if (token.type == DIV){
                this.eat(DIV)
            }

            node = new BinOp(node, token, this.factor(), this.current_line)
		}

		return node
	}

	//Third lowest level item: Consists of addition or subtraction
	this.expr = function(){
		var node = this.term()

		while (this.current_token.type == PLUS || this.current_token.type == MINUS){
			var token = this.current_token
            if (token.type == PLUS){
                this.eat(PLUS)
            } else if (token.type == MINUS){
                this.eat(MINUS)
            }
            node = new BinOp(node, token, this.term(), this.current_line)
		}

		return node
	}

	//Fourth lowest level item: Consists of comparison between two other expressions
	this.comparison = function(){
		var node = this.expr()

		while ([GREATER_THAN, LESS_THAN, EQUAL, NOT_EQUAL, AND, OR].indexOf(this.current_token.type) != -1){
			var token = this.current_token
			this.eat(token.type)
			node = new Comparison(node, token, this.expr(), this.current_line)
		}
		return node
	}

	//Fifth lowest level item: Consists of an if, assignment, while or for statement
	this.statement = function(indentation){
		if(this.current_token.type == ID){
			var node = this.assignment_statement()
		} else if (this.current_token.type == IF_STATEMENT){
			var node = this.if_statement(indentation)
		} else if (this.current_token.type == WHILE_LOOP){
			var node = this.while_loop(indentation)
		} else if (this.current_token.type == FOR_LOOP){
			var node = this.for_loop(indentation)
		} else {
			var node = this.empty()
		}
		return node
	}

	//Sixth lowest level item: Consists of a list of statements
	this.statement_list = function(indentation){
		var node = this.statement(indentation)
		var results = [node]

		while(this.current_token.type == NEWLINE){
			var indent = this.current_token.value
			if(indent == indentation){
				this.eat(NEWLINE)
				this.current_line += 1
			} else {
				return results
			}
			results.push(this.statement(indentation))
			
		}

		return results
	}

	//Seventh lowest level item: Consists of a single list of statements at a certain indentation
	this.compound_statement = function(indentation){
		var nodes = this.statement_list(indentation)
		var root = new Compound(this.current_line)
		for(var i=0; i < nodes.length; i++){
			root.children.push(nodes[i])
		}
		//console.log(root)
		return root
	}

	//Highest level item: Consists of a single compound statement at indentation 0
	this.program = function(){
		return this.compound_statement(0)
	}

	//Create an if statement node: Condition -> Statements indented by 1
	this.if_statement = function(indentation){
		var token = this.current_token
		this.eat(IF_STATEMENT)
		var condition = this.comparison()
		this.eat(COLON)
		var statements = this.compound_statement(indentation + 1)
		return new If_Statement(token, condition, statements, this.current_line)
	}

	//Create a while loop node: Condition -> Statements indented by 1
	this.while_loop = function(indentation){
		var token = this.current_token
		this.eat(WHILE_LOOP)
		var condition = this.comparison()
		this.eat(COLON)
		var statements = this.compound_statement(indentation + 1)
		return new While_Loop(token, condition, statements, this.current_line)
	}

	//Create a while loop node: Variable -> Iterable -> Statements indented by 1
	this.for_loop = function(indentation){
		var token = this.current_token
		this.eat(FOR_LOOP)
		var id = this.variable()
		this.eat(IN)
		var iter = this.comparison()
		this.eat(COLON)
		var statements = this.compound_statement(indentation + 1)
		return new For_Loop(token, id, iter, statements, this.current_line)
	}

	//Create an assignment statement node: Variable -> Comparison to assign
	this.assignment_statement = function(){
		var left = this.variable()
		var token = this.current_token
		this.eat(ASSIGN)
		var right = this.comparison()
		return new Assign(left,token,right, this.current_line)
	}

	//Create a variable node: Id -> Indexing
	this.variable = function(){
		var node = this.id()
		while (this.current_token.type == LSQUARE){
			this.eat(LSQUARE)
			var index = this.expr()
			this.eat(RSQUARE)
			node = new Index(node, index, this.current_line)
		}
		return node
	}

	//Create an id node: If its not yet seen or is a built-in function store it as a value that goes on the grid
	this.id = function(){
		var node = new Var(this.current_token, this.current_line)
		if(this.values.indexOf(this.current_token.value) == -1 && !BUILTIN[this.current_token.value]){
			this.values.push(this.current_token.value)
		}
		this.eat(ID)
		return node
	}

	//Process an empty line
	this.empty = function(){
		return new NoOp(this.current_line)
	}

	//Throw an error when a non-expected token is found
	this.error = function(type, token){
		marker = editor.session.addMarker(new Range(this.current_line, 0, this.current_line, 1), "current", "fullLine")
		throw "Syntax Error: Expected " + type + " got " + token.value + " (" + token.type + ")"
	}

	//Process a token, if its the incorrect one throw an error
	this.eat = function(type){
		if (this.current_token.type == type){
			this.current_token = this.lexer.get_next_token()
		} else {
			this.error(type, this.current_token)
		}
	}

	//Parse the tokens taken from the lexer
	this.parse = function(){
		tree = this.program()
		return [tree, this.values]
	}
}