FONT = "/normal 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', 'source-code-pro', monospace"
VALUE_COLOR = "rgb(200,250,250)"
TEXT_COLOR = "rgb(00,140,140)"
CELL_COLOR =  [[50,50,50],[90,90,90]]
LABEL_COLOR = [[100,100,100],[140,140,140]]

LABEL_FONTSIZE = 6
LABEL_SIZE = 6

CELL_WIDTH = 38
CELL_HEIGHT = 16

VALUE_MARGIN = 2
VALUE_FONTSIZE = 6
VALUE_FONTWIDTH = Number(VALUE_FONTSIZE/3*2)
VALUE_LIMIT = 5
VALUE_HEIGHT = 8
VALUE_WIDTH = 2*VALUE_MARGIN + VALUE_LIMIT*VALUE_FONTWIDTH + 4

INDEX_WIDTH = VALUE_FONTWIDTH + 2
INDEX_LIMIT = 5
INDEX_COLOR = "rgb(160,200,200)"

LIST_WIDTH = VALUE_WIDTH + 4
LIST_HEIGHT = VALUE_HEIGHT + 4
LIST_COLOR = "rgb(50,50,50)"
ARROW_COLOR = "rgb(70,70,70)"

CELL_LAYER = 10
LIST_LAYER = 30
VALUE_LAYER = 40

ACTIVE_LAYER = 100

//Basic Graphic object that each other graphical element inherits from
var Graphic = function(){
	this.x = 0
	this.y = 0
	//Graphical objects that should be moved with their parent e.g. G_Value
	this.children = []
	//Lower level Graphix objects that should be moved with their parent e.g. Rectangle
	this.objects = []
	//Whether or not the object and its children are visible
	this.visible = false
	//Move the object and its children if coordinates are given and then draw them
	this.draw = function(x,y){
		if(x != undefined && y != undefined){
			this.move(x,y)
		}
		if(!this.visible){
			for(var i = 0; i < this.children.length; i++){
				this.children[i].draw()
			}
			anim.show(this.objects)
			this.visible = true
		}
	}
	//Move the object and its children
	this.move = function(x,y,t){
		for(var i = 0; i < this.children.length; i++){
			this.children[i].move(x,y,t)
		}
		for(var i = 0; i < this.objects.length; i ++){
			anim.move(this.objects[i],x,y,t)
		}
		this.x = x
		this.y - y
	}
	//Hide the object and its children
	this.destroy = function(){
		if(this.visible){
			for(var i = 0; i < this.children.length; i++){
				this.children[i].destroy()
			}
			anim.hide(this.objects)
			this.visible = false
		}
	}
	//Relayer the object and its children
	this.layer = function(layer){
		anim.layer(this.objects,layer)
		this.l = layer
	}
	//Set all of the object and its children's ui 
	this.ui = function(bool){
		for(var i = 0; i < this.objects.length; i ++){
			this.objects[i].ui = bool
		}
	}
	//Generate html rgb colors from a list
	this.getColor = function(off){
		return "rgb(" + String(this.color[0] + off[0]) + "," + String(this.color[1] + off[1]) + "," + String(this.color[2] + off[2]) + ")"
	}
	//Get the leftmost bound of the object
	this.left = function(){
		return this.objects[0].left()
	}
}

//Object for a value that is either a character or a number
var G_Value = function(value, ignore){
	//If trying to create a value for something that is not a character or a number create a specialised value
	if(value instanceof Array){
		return new G_List(value.map((v) => new G_Value(v)))
	} else if(typeof(value) == "boolean"){
		return new G_Bool(value)
	} else if(typeof(value) == "string" && value.length > 1){
		return new G_String(value)
	} else {
		this.value = value
	}
	this.limit = VALUE_LIMIT
	this.l = VALUE_LAYER
	//Graphics
	Graphic.call(this)
	this.getObjects = function(){
		if (this.value.length > VALUE_LIMIT){
			this.objects = [new Rectangle(0, 0, VALUE_WIDTH, VALUE_HEIGHT, VALUE_COLOR, VALUE_LAYER+1),
							new Characters(0, 0, String(this.value).slice(0,VALUE_LIMIT) + "\u2025", TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+2)]
		}else{
			this.objects = [new Rectangle(0, 0, VALUE_WIDTH, VALUE_HEIGHT, VALUE_COLOR, VALUE_LAYER+1),
							new Characters(0, 0, String(this.value), TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+2)]
		}
	}
	this.copy = function(){
		return new G_Value(this.value)
	}

	this.pop = function(){
		//this.draw()
		anim.pop(this.objects[0], 2, 5 * 4)
	}

	this.move = function(x,y,t){
		anim.move(this.objects[0],x,y,t)
		anim.move(this.objects[1],x,y,t)
		this.x = x
		this.y = y 
	}
	this.getObjects()
}

//Object that handles the indexes in a list or string
var G_Index = function(i, value){
	this.index = i
	this.value = value
	this.l = VALUE_LAYER + 10
	Graphic.call(this)
	this.objects = [new Rectangle(0, 0, INDEX_WIDTH, VALUE_HEIGHT, INDEX_COLOR, VALUE_LAYER+13, [0,0.5]),
					new Characters(0,0, i, TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+14, [0.5,0.5])]
	this.children = [this.value]
	this.move = function(x,y,t){
		this.value.move(x,y,t)
		this.x = x
		this.y = y
		anim.move(this.objects[0],this.value.left(),t)
		anim.move(this.objects[1],this.objects[0].center(),t)
	}
	this.pop = function(){
		this.value.pop()
		anim.pop(this.objects[0], 2, 5 * 4)
	}
	this.layer = function(l){
		anim.layer(this.objects, l+10)
		this.value.layer(l)
		this.l = l
	}

	//reshows index
	this.renumber = function(num){
		if(num != undefined){
			this.objects[1].text = String(num)
		}
		anim.show(this.objects)
	}

	//hides index
	this.unnumber = function(){
		anim.hide(this.objects)
	}

	this.draw = function(x,y,t){
		this.value.draw(x,y,t)
		this.visible = true
	}
	this.destroy = function(){
		this.value.destroy()
		this.visible = false
	}
}

//Bool specialised value subclass
var G_Bool = function (value){
	this.value = value
	this.l = VALUE_LAYER
	Graphic.call(this)
	this.getObjects = function(){
		if (this.value){
			this.objects = [new Rectangle(0, 0, VALUE_WIDTH, VALUE_HEIGHT, VALUE_COLOR, VALUE_LAYER+1),
							new Characters(0, 0, "true", TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+2)]
		}else{
			this.objects = [new Rectangle(0, 0, VALUE_WIDTH, VALUE_HEIGHT, VALUE_COLOR, VALUE_LAYER+1),
							new Characters(0, 0, "false", TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+2)]
		}
	}
	this.copy = function(){
		return new G_Value(this.value)
	}

	this.pop = function(){
		anim.pop(this.objects[0], 2, 5 * 4)
	}

	this.move = function(x,y,t){
		anim.move(this.objects[0],x,y,t)
		anim.move(this.objects[1],x,y,t)
		if(this.objects[2]){anim.move(this.objects[2],x,y,t)}
		this.x = x
		this.y = y 
	}
	this.getObjects()	
}

//Array specialised value subclass
var G_List = function(values){
	this.l = LIST_LAYER
	Graphic.call(this)
	this.getObjects = function(v){
		for(var i = 0; i < v.length; i++){
			this.indexes.push(new G_Index(i, v[i]))
		}
		this.objects = [new Rectangle(0,0, LIST_WIDTH, LIST_HEIGHT, "rgba(0,0,0,0)", LIST_LAYER),
						new Rectangle(0,0, LIST_WIDTH, LIST_HEIGHT, LIST_COLOR, LIST_LAYER, [0,0]),
						new Polygon(0,0, [{"x":0, "y":0},
										  {"x":VALUE_WIDTH, "y":0}, 
										  {"x":VALUE_WIDTH/2, "y":VALUE_HEIGHT}],
										  ARROW_COLOR, LIST_LAYER+1)]
	}
	this.indexes = []
	this.getObjects(values)
	this.length = this.indexes.length
	this.extended = false
	this.move = function(x,y,t){
		anim.move(this.objects[0], x, y,t)
		anim.move(this.objects[1], this.objects[0].left()[0], this.objects[0].upper()[1], t)
		anim.move(this.objects[2], x, y, t)
		if(!this.extended){
			for(var i = 0; i < this.indexes.length; i++){
				this.indexes[i].move(x,y,t)
			}
		} else {
			if(this.indexes[0]){this.indexes[0].move(x,y,t)}
		}
		this.x = x
		this.y = y
	}

	this.draw = function(x,y){
		if(x != undefined && y != undefined){
			this.move(x,y)
		}
		if(!this.visible){
			if(!this.extended){
				for(var i = 0; i < this.indexes.length; i++){
					if(i == 0){
						this.indexes[i].draw(x,y)
					} else {
						this.indexes[i].destroy()
					}
				}
				anim.show(this.objects)
			} else {
				anim.show(this.objects)
			}
			this.visible = true
		}
	}


	this.pop = function(){
		if(this.indexes[0]){this.indexes[0].pop()}
	}

	//collapses list: even = horizontal, odd = vertical
	this.collapse = function(){
		this.l = LIST_LAYER
		var depth = this.extended - 1
		//loop through indexes
		for (var i = 0; i < this.indexes.length; i++){
			anim.opensub()

			//move to home position
			this.indexes[i].move(this.x, this.y, 5 * 4)

			//if this is the last active list we need to return to the inactive layer
			if(depth == 0){								
				this.indexes[i].layer(VALUE_LAYER)
				anim.layer(this.objects, LIST_LAYER)
			}
			anim.nextsub()

			//hide index numbers and extra values
			this.indexes[i].unnumber()					
			if(i != 0){
				this.indexes[i].destroy()
			}
			anim.closesub()
		}
		anim.opensub()

		//resize container to match closed array
		anim.size(this.objects[1], [LIST_WIDTH*(1 + this.length*(depth%2)), 
									LIST_HEIGHT*(1 + this.length*!(depth%2)), 
									LIST_WIDTH, LIST_HEIGHT], 5 * 4)
		anim.nextsub()

		//if this is the last active list we need to return to the inactive layer
		if(depth == 0){	
			anim.layer(this.objects, LIST_LAYER)
		}
		anim.closesub()
		anim.close()
		this.extended = false 
	}

	//extends list: even = horizontal, odd = vertical
	this.extend = function(depth){
		this.l = ACTIVE_LAYER
		//loop through indexes
		for(var i = 0; i < this.indexes.length; i++){
			anim.opensub()

			//relayer to active layer
			this.indexes[i].layer(ACTIVE_LAYER + 10)
			anim.nextsub()

			//add back in indexes
			this.indexes[i].renumber(i)

			//draw in missing values
			if(i != 0){
				this.indexes[i].draw()
			}
			anim.nextsub()

			//move to correct spacing
			this.indexes[i].move(this.x + LIST_WIDTH*((1 + Number(i))*(depth%2)), 
								 this.y + LIST_HEIGHT*((1 + Number(i))*!(depth%2)), 5 * 4)
			anim.closesub()
		}
		anim.opensub()

		//relayer to active layer
		anim.layer(this.objects, ACTIVE_LAYER)
		anim.nextsub()

		//resize container
		anim.size(this.objects[1], [LIST_WIDTH, LIST_HEIGHT, 
									LIST_WIDTH*(1 + this.length*(depth%2)), 
									LIST_HEIGHT*(1 + this.length*!(depth%2))], 5 * 4)
		anim.closesub()
		anim.close()
		this.extended = depth + 1
	}

	//shortens list and returns last value
	this.pull = function(){
		val = this.indexes.pop().value
		this.length -= 1
		return val
	}

	//adds to end of list
	this.push = function(values){
		this.indexes.push(new G_Index(this.length, value))
		this.length += 1
	}

	//returns copy of ith value
	this.get = function(i){
		return this.indexes[i].value.copy()
	}

	//replaces ith value with given value
	this.set = function(i, value){
		this.indexes[i].value.destroy()
		this.indexes[i].value = value
		value.layer(this.l+10)
		value.move(this.x + LIST_WIDTH*((1 + Number(i))*((this.extended - 1)%2)), 
				   this.y + LIST_HEIGHT*((1 + Number(i))*!((this.extended - 1)%2)))
		value.draw()
		this.indexes[i].pop()
		anim.close()
	}

	//returns x and y of leftmost side of first value
	this.left = function(){
		if(this.indexes[0]){return this.indexes[0].value.left()}
	}

	//create new G_List object by deepcopying self
	this.copy = function(){
		values = []
		for(var i = 0; i < this.indexes.length; i++){
			values.push(this.indexes[i].value.copy())
		}
		return new G_List(values)
	}

	//relayer objects
	this.layer = function(layer){
		for(var i = 0; i < this.indexes.length; i++){
			this.indexes[i].layer(layer+10)
		}
		anim.layer(this.objects, layer)
		this.l = layer
	}

	//hide all objects
	this.destroy = function(){
		if(this.visible){
			anim.hide(this.objects)
			for(var i = 0; i < this.indexes.length; i++){
				this.indexes[i].destroy()
			}
			this.visible = false
		}
	}
}

//String specialised value subclass (very similar to Array)
var G_String = function(value){
	Graphic.call(this)
	this.l = LIST_LAYER
	this.getObjects = function(v){
		for(var i = 0; i < v.length; i++){
			this.indexes.push(new G_Index(i, new G_Value(v[i])))
		}
		if (this.value.length > VALUE_LIMIT){
			this.objects = [new Rectangle(0,0, LIST_WIDTH, LIST_HEIGHT, "rgba(0,0,0,0)", LIST_LAYER),
							new Rectangle(0,0, LIST_WIDTH, LIST_HEIGHT, LIST_COLOR, LIST_LAYER, [0,0]),
							new Polygon(0,0, [{"x":0, "y":0},
										  {"x":VALUE_WIDTH, "y":0}, 
										  {"x":VALUE_WIDTH/2, "y":VALUE_HEIGHT}],
										  ARROW_COLOR, LIST_LAYER+1),
							new Rectangle(0, 0, VALUE_WIDTH, VALUE_HEIGHT, VALUE_COLOR, VALUE_LAYER+1),
							new Characters(0, 0, this.value.slice(0,VALUE_LIMIT) + "\u2025", TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+2)]
		}else{
			this.objects = [new Rectangle(0,0, LIST_WIDTH, LIST_HEIGHT, "rgba(0,0,0,0)", LIST_LAYER),
							new Rectangle(0,0, LIST_WIDTH, LIST_HEIGHT, LIST_COLOR, LIST_LAYER, [0,0]),
							new Polygon(0,0, [{"x":0, "y":0},
										  {"x":VALUE_WIDTH, "y":0}, 
										  {"x":VALUE_WIDTH/2, "y":VALUE_HEIGHT}],
										  ARROW_COLOR, LIST_LAYER+1),
							new Rectangle(0, 0, VALUE_WIDTH, VALUE_HEIGHT, VALUE_COLOR, VALUE_LAYER+1),
							new Characters(0, 0, this.value, TEXT_COLOR, VALUE_FONTSIZE, FONT, VALUE_LAYER+2)]
		}
	}
	this.value = value
	this.indexes = []
	this.getObjects(value)
	this.length = this.indexes.length
	this.extended = false

	this.move = function(x,y,t){
		anim.move(this.objects[0], x, y,t)
		anim.move(this.objects[1], this.objects[0].left()[0], this.objects[0].upper()[1], t)
		anim.move(this.objects[2], x, y, t)
		anim.move(this.objects[3], x, y, t)
		anim.move(this.objects[4], x, y, t)
		if(!this.extended){
			for(var i = 0; i < this.indexes.length; i++){
				this.indexes[i].move(x,y,t)
			}
		} 
		this.x = x
		this.y = y
	}

	this.draw = function(x,y){
		if(x != undefined && y != undefined){
			this.move(x,y)
		}
		if(!this.visible){
			if(!this.extended){
				for(var i = 0; i < this.indexes.length; i++){
					this.indexes[i].destroy()
				}
				anim.show(this.objects)
			} else {
				anim.show(this.objects)
			}
			this.visible = true
		}
	}


	this.pop = function(){
		anim.pop(this.objects[3])
	}

	//collapses list: even = horizontal, odd = vertical
	this.collapse = function(depth){
		
		//loop through indexes
		for (var i = 0; i < this.indexes.length; i++){
			anim.opensub()

			//move to home position
			this.indexes[i].move(this.x, this.y, 5 * 4)

			//if this is the last active list we need to return to the inactive layer
			if(depth == 0){								
				this.indexes[i].layer(VALUE_LAYER)
				anim.layer(this.objects, LIST_LAYER)
			}
			anim.nextsub()

			//hide index numbers and extra values
			this.indexes[i].unnumber()					
			this.indexes[i].destroy()
			anim.closesub()
		}
		anim.opensub()

		//resize container to match closed array
		anim.size(this.objects[1], [LIST_WIDTH*(1 + this.length*(depth%2)), 
									LIST_HEIGHT*(1 + this.length*!(depth%2)), 
									LIST_WIDTH, LIST_HEIGHT], 5 * 4)
		anim.nextsub()

		//if this is the last active list we need to return to the inactive layer
		if(depth == 0){	
			anim.layer(this.objects, LIST_LAYER)
		}
		anim.layer(this.objects.slice(3), LIST_LAYER + 10)
		anim.show(this.objects.slice(3))
		anim.closesub()
		anim.close()
		this.extended = false 
	}

	//extends list: even = horizontal, odd = vertical
	this.extend = function(depth){

		//loop through indexes
		for(var i = 0; i < this.indexes.length; i++){
			anim.opensub()

			//relayer to active layer
			this.indexes[i].layer(ACTIVE_LAYER + 10)
			anim.nextsub()

			//add back in indexes
			this.indexes[i].renumber(i)

			//draw in missing values
			this.indexes[i].draw()
			anim.nextsub()

			//move to correct spacing
			this.indexes[i].move(this.x + LIST_WIDTH*((1 + Number(i))*(depth%2)), 
								 this.y + LIST_HEIGHT*((1 + Number(i))*!(depth%2)), 5 * 4)
			anim.closesub()
		}
		anim.opensub()

		//relayer to active layer
		anim.hide(this.objects.slice(3))
		anim.layer(this.objects, ACTIVE_LAYER)
		anim.nextsub()

		//resize container
		anim.size(this.objects[1], [LIST_WIDTH, LIST_HEIGHT, 
									LIST_WIDTH*(1 + this.length*(depth%2)), 
									LIST_HEIGHT*(1 + this.length*!(depth%2))], 5 * 4)
		anim.closesub()
		anim.close()
		this.extended = true
	}

	//shortens list and returns last value
	this.pull = function(){
		val = this.indexes.pop().value
		this.length -= 1
		return val
	}

	//adds to end of list
	this.push = function(values){
		this.indexes.push(new G_Index(this.length, value))
		this.length += 1
	}

	//returns copy of ith value
	this.get = function(i){
		return this.indexes[i].value.copy()
	}

	//returns x and y of leftmost side of first value
	this.left = function(){
		return this.object[3].left()
	}

	//create new G_List object by deepcopying self
	this.copy = function(){
		return new G_String(this.value)
	}

	//relayer objects
	this.layer = function(layer){
		for(var i = 0; i < this.indexes.length; i++){
			this.indexes[i].layer(layer+10)
		}
		anim.layer(this.objects, layer)
		anim.layer(this.objects.slice(3), layer+10)
		this.l = layer
	}

	//hide all objects
	this.destroy = function(){
		if(this.visible){
			anim.hide(this.objects)
			for(var i = 0; i < this.indexes.length; i++){
				this.indexes[i].destroy()
			}
			this.visible = false
		}
	}
}

//Class that handles a single variable (label and value)
var G_Variable = function(name, color){
	//Info
	this.name = name
	this.color = color
	this.l = CELL_LAYER

	//replaces value with 
	this.set = function(value){
		if(this.value){
			this.clear()
		}
		this.value = value
		this.children = [value]

		anim.opensub()
		value.layer(VALUE_LAYER)
		value.draw()
		value.move(this.x,this.y)
		anim.nextsub()
		value.pop()
		anim.closesub()
	}

	//returns copy of value
	this.get = function(){
		return this.value.copy()
	}

	//deletes value
	this.clear = function(){
		this.value.destroy()
		this.value = undefined
		this.children = []
	}

	//Graphics
	Graphic.call(this)
	this.objects = [new Characters(0, 0, this.name,false,LABEL_FONTSIZE,FONT, CELL_LAYER+1)]

	this.move = function(x,y,t){
		anim.move(this.objects[0], x, y - LABEL_SIZE/2 - CELL_HEIGHT/2, t)
		if(this.value){
			this.value.move(x,y,t)
		}
		this.x = x
		this.y = y
	}
}

//Class that handles a cell on the grid that holds a variable
var G_Cell = function(count, color){
	this.l = CELL_LAYER
	//Info
	this.color = color
	this.variable = ""
	this.set = function(variable){
		this.variable = variable
		this.children = [variable]
	}

	//Graphics
	Graphic.call(this)
	this.objects = [new Rectangle(0,0, CELL_WIDTH, CELL_HEIGHT, this.getColor(CELL_COLOR[count%2]),  CELL_LAYER),
					new Rectangle(0,0, CELL_WIDTH, LABEL_SIZE,  this.getColor(LABEL_COLOR[count%2]), CELL_LAYER, [0.5,1])]

	this.move = function(x,y,t){
		anim.move(this.objects[0],x,y,t)
		anim.move(this.objects[1],this.objects[0].upper(),t)
		if(this.variable){
			this.variable.move(x,y,t)
		}
		this.x = x
		this.y = y
	}

}

//Class that handles the 2D Array of cells and the stack object
var G_Grid = function(width,height,color){
	//Info
	this.l = CELL_LAYER
	this.color = color
	this.width = width
	this.height = height
	this.cells = []
	this.variables = {}
	this.stack = new Stack(height, color)

	//Graphics
	Graphic.call(this)
	this.children = [this.stack]

	this.move = function(x,y,t){
		this.stack.move(x,y,t)
		for (var i = 0; i < width; i++){
			for (var j = 0; j < height; j++){
				this.cells[i][j].move((i+1)*CELL_WIDTH + x,j*(CELL_HEIGHT+LABEL_SIZE) + y,t)
			}
		}
		this.x = x
		this.y = y
	}

	//Generates the list of cells and variable based on required values
	this.populate = function(values){
		if(!values){values = []}
		var c = 0
		for (var x = 0; x < width; x++){
			temp = []
			for (var y = 0; y < height; y++){
				cell = new G_Cell(x+y, this.color)
				if(c < values.length){
					v = new G_Variable(values[c])
					cell.set(v)
					this.variables[values[c]] = v
					c++
				}
				temp.push(cell)
				this.children.push(cell)
				
			}
			this.cells.push(temp)
		}	
	}
}

G_Value.prototype = Object.create(Graphic.prototype)
G_Variable.prototype = Object.create(Graphic.prototype)
G_Cell.prototype = Object.create(Graphic.prototype)
G_Grid.prototype = Object.create(Graphic.prototype)

G_Index.prototype = Object.create(Graphic.prototype)
G_List.prototype = Object.create(Graphic.prototype)

G_Value.prototype.constructor = G_Value
G_Variable.prototype.constructor = G_Variable
G_Cell.prototype.constructor = G_Cell
G_Grid.prototype.constructor = G_Grid

G_Index.prototype.constructor = G_Index
G_List.prototype.constructor = G_List