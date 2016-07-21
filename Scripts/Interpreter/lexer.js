//Determine all types of tokens that are valid
NUMBER = "NUMBER"
ID = "ID"
ASSIGN = "="

EOF = "EOF"
PLUS = "PLUS"
MINUS = "MINUS"
MUL = "MUL"
DIV = "DIV"

EQUAL = "EQUAL"
NOT_EQUAL = "NOT_EQUAL"
LESS_THAN = "LESS_THAN"
GREATER_THAN = "GREATER_THAN"
AND = "AND"
OR = "OR"
NOT = "NOT"

LPAREN = "("
RPAREN = ")"
LSQUARE = "["
RSQUARE = "]"
NEWLINE = "NEWLINE"
COLON = ":"
COMMA = ","
STR = "STR"

IF_STATEMENT = "IF_STATEMENT"
WHILE_LOOP = "WHILE_LOOP"
FOR_LOOP = "FOR_LOOP"
IN = "IN"
BOOL = "BOOL"

//Determine keywords and their corresponding token
KEYWORDS = {"if":IF_STATEMENT,
			"while":WHILE_LOOP,
			"for":FOR_LOOP,
			"in":IN,
			"True":BOOL,
			"False":BOOL,
			"and":AND,
			"or":OR,
			"not":NOT}

//Determine built-in functions
BUILTIN = {"len":true,
			"str":true,
			"int":true,
			"bool":true,
			"range":true,
			"float":true}

//Determine symbols and their corresponding token
SYMBOL = {
	"+":PLUS, 
	"-":MINUS, 
	"/":DIV,
	"*":MUL,
	"=":ASSIGN,
	")":RPAREN,
	"(":LPAREN,
	"[":LSQUARE,
	"]":RSQUARE,
	">":GREATER_THAN,
	"<":LESS_THAN,
	":":COLON,
	",":COMMA,
		}

//Functions to check if the obj passed is of a certain type: whitespace, alphabetical, alphanumeric, numerical
function isNumeric(obj) {
    return obj - parseFloat(obj) >= 0;
}

function isWhitespace(obj){
	if(obj == "\n"){
		return false
	} else {
		return /^\s$/i.test(obj)
	}
}

function isAlpha(obj){
	return /^[a-z]$/i.test(obj)
}

function isAlNum(obj){
	return /^[a-z0-9]$/i.test(obj) 
}

//Token object to store their type and value
var Token = function(type, value){
	this.type = type
	this.value = value
}

//Lexer object that converts code to tokens
var Lexer = function (text){
	this.text = text || ""
	this.pos = 0
	this.current_char = this.text[this.pos]

	//Throw an error when an invalid token is found
	this.error = function(token){
		throw "Invalid Character: "
	}

	//Move to the next character, if there are none left get an EOF character
	this.advance = function(){
		this.pos += 1
		if (this.pos > this.text.length - 1){
			this.current_char = undefined
		} else {
			this.current_char = this.text[this.pos]
		}
	}

	//Look at the next character to see if it matches e.g. second = for "=="
	this.peek = function(){
		var peek_pos = this.pos + 1
		if (peek_pos > this.text.length- 1){
			return
		}else{
			return this.text[peek_pos]
		}
	}

	//Skip over any whitespace
	this.skip_whitespace = function(){
		while (this.current_char != undefined && isWhitespace(this.current_char)){
			this.advance()
		}
	}

	//Process a number
	this.number = function(){
		var result = ''
		//Any number of number characters
		while (this.current_char != undefined && isNumeric(this.current_char)){
			result += this.current_char
			this.advance()
		}
		//Possible fullstop as decimal place
		if(this.current_char == "."){
			result += this.current_char
			this.advance()
		}
		//Any further number of number characters
		while (this.current_char != undefined && isNumeric(this.current_char)){
			result += this.current_char
			this.advance()
		}
		//Return ncharacters as a number
		return Number(result)
	}

	//Process as a string
	this.string = function(){
		var result = ""
		this.advance()
		//Get any number of characters until a quote symbol
		while(this.current_char != "'" && this.current_char != '"'){
			result += this.current_char
			this.advance()
		}
		this.advance()
		//Return string
		return result

	}

	//Process an id (variable name or keyword)
	this.id = function(){
		var result = ''
		//Get any number of alphanumeric characters
		while(this.current_char != undefined && isAlNum(this.current_char)){
			result += this.current_char
			this.advance()
		}
		//If its a keyword return a token of the keyword's type else return an ID token
		if(KEYWORDS[result]){
			return new Token(KEYWORDS[result],result)
		} else {
			return new Token(ID, result)
		}
		
	}

	//Process the amount of indentation
	this.indent = function(){
		result = 0
		while(this.current_char == " "){
			result += 1
			this.advance()
		}
		return Math.floor(result/4)
	}

	//Get the next token
	this.get_next_token = function(){
		if (this.current_char != undefined){
			//If its non-newline whitespace skip it
			if (isWhitespace(this.current_char)){
				this.skip_whitespace()
			}
			//If its a quotation mark process a string
			if(this.current_char == "'" || this.current_char == '"'){
				return new Token(STR, this.string())
			}
			//If its alphabetical process an id
			if(isAlpha(this.current_char)){
				return this.id()
			}
			//Check for double equals
			if(this.current_char == "=" && this.peek() == "="){
				this.advance()
				this.advance()
				return new Token(EQUAL, "==")
			}
			//Check for not equal to
			if(this.current_char == "!" && this.peek() == "="){
				this.advance()
				this.advance()
				return new Token(NOT_EQUAL, "!=")
			}
			//If its a new line process the indentation
			if(this.current_char == "\n"){
				this.advance()
				return new Token(NEWLINE, this.indent())
			}
			//If its numeric process a number
			if (isNumeric(this.current_char)){
				return new Token(NUMBER, this.number())
			}
			//If its another valid symbol return a token of that symbol's type
			if(SYMBOL[this.current_char]){
				var char = this.current_char
				this.advance()
				return new Token(SYMBOL[char], char)
			}
			//If its none of those throw an error
			this.error(this.current_char)
		}
		//If token is undefined you have reached EOF
		return new Token(EOF)
	}
}