ROBOT_COLOR = '#cc0000'
ROBOT_SIZE = 16
ROBOT_LAYER = 200
CARRY_LAYER = 210
OP_LAYER = 230
STACK_LAYER = CELL_LAYER
STACK_COLOR = [[40,40,40],[30,30,30]]

//Add array.last() method for getting the last item in an array
Object.defineProperty(Array.prototype, "last", {value: function last(){return this[this.length - 1]}})

//Object that handles items on the stack
var Stack = function(height, color){
	//Create the robot object
	this.robot = new Robot()

	//Inherit color from grid
	this.color = color
	this.values = []

	this.depth = 0
	this.path = []
	this.pos = 0

	//Determine maximum amount of items on the stack
	this.max = Math.ceil((height*(CELL_HEIGHT + LABEL_SIZE) - 2*LABEL_SIZE)/CELL_HEIGHT) - 1

	Graphic.call(this)
	this.children = [this.robot]
	this.objects = [new Rectangle( 0,0, CELL_WIDTH, (CELL_HEIGHT + LABEL_SIZE)*height,  this.getColor(STACK_COLOR[0]), STACK_LAYER, [0.5,(CELL_HEIGHT/2 + LABEL_SIZE)/((CELL_HEIGHT + LABEL_SIZE)*(height))]),
					new Rectangle( 0,0, CELL_WIDTH, LABEL_SIZE, 						this.getColor(STACK_COLOR[1]), STACK_LAYER + 1 , [0.5,0]),
					new Rectangle( 0,0, CELL_WIDTH, LABEL_SIZE, 						this.getColor(STACK_COLOR[1]), STACK_LAYER + 9, [0.5,1]),
					new Characters(0,0, "STACK", 										this.getColor(LABEL_COLOR[1]), LABEL_FONTSIZE ,FONT, STACK_LAYER + 2, [0.5,0])]

	//Move robot to a certain variable or item
	this.goto = function(variable){
		this.pos = variable.value
		this.robot.moveTo(variable.value)
	}

	//Get value in certain variable and put it on stack
	this.get = function(variable){
		if(variable){
			this.goto(variable)
		}
		this.push(this.pos.copy())
	}

	//Go to a certain variable and recursively navigate through its indexes to the given value
	this.set = function(variable, indexes, depth){
		//If there is a set of indexes to got to
		if(indexes){
			//If its the first time this is being called set the target to the value and depth to 0
			if(variable instanceof G_Variable){
				variable = variable.value
			}
			if(depth == undefined){
				depth = 0
			}
			//If this is the last index get the value
			if(indexes.length == 1){
				variable.extend(depth)
				this.robot.moveTo(variable.indexes[indexes[0]].value)
				anim.close()
				variable.set(indexes.last(), this.pull())
				this.robot.moveTo(variable)
				variable.collapse(depth)
			//Otherwise expand the current list and go to the next one
			} else {
				variable.extend(depth)
				value = variable.indexes[indexes[0]].value
				this.robot.moveTo(value)
				anim.close()
				this.set(value, indexes.slice(1), depth + 1)
				anim.close()
				this.robot.moveTo(variable)
				variable.collapse(depth)
			}
		//If not navigating a list just go get a copy of the variable's value
		} else {
			this.robot.moveTo(variable)
			anim.close()
			variable.set(this.pull())
		}
	}

	//Operate on a set of items from the stack returning a result
	this.operate = function(num, result, operator){
		points = []
		values = []
		places = Math.floor(num/2)
		//If an operator is specified create the tile to display it
		if(operator){
			operator = [new Characters(this.robot.x, this.robot.y, operator, TEXT_COLOR, LABEL_FONTSIZE, FONT, ROBOT_LAYER + 4),
						new Rectangle(this.robot.x, this.robot.y, 2*VALUE_MARGIN + operator.length*VALUE_FONTWIDTH + 4, VALUE_HEIGHT, VALUE_COLOR, ROBOT_LAYER + 3)]
			anim.show(operator)
		}
		//Stop the robot from displaying values from the stack
		this.robot.display(false)

		//If the number is odd place the extra one below otherwise put the same amount above and below the robot
		if(num%2){
			for(var i = 0; i < places; i++){
				points.push([this.robot.x, this.robot.y - (places - i) * (VALUE_HEIGHT+4)])
			}
			for(var i = 0; i < places + 1; i ++){
				points.push([this.robot.x, this.robot.y  + (i + 1) * (VALUE_HEIGHT+4)])
			}
		} else {
			for(var i = 0; i < places; i++){
				points.push([this.robot.x, this.robot.y - (places - i) * (VALUE_HEIGHT+4)])
			}
			for(var i = 0; i < places; i ++){
				points.push([this.robot.x, this.robot.y  + (i + 1) * (VALUE_HEIGHT+4)])
			}
		}

		//Go through each position
		for(var i = 0; i < num; i++){
			
			//Pop from the robot
			v = this.robot.children.pop()
			//Draw it if not already visible
			if(!v.visible){v.draw()}
			//Move it to the robot
			v.move(this.robot.x,this.robot.y)
			//Layer it above everything else
			v.layer(OP_LAYER)

			anim.close()

			//Store the object to be moved later
			values.push(v)
			//Move it to its position generated earlier
			v.move(points[num - i - 1][0],points[num - i - 1][1], 5 * 4)
			anim.close()

			//Destroy the extra copy
			this.values.last().destroy()
			anim.close()

			this.pull()

			
		}
		anim.close()

		//If an operator is being used pop it
		if(operator){anim.pop(operator[1], 2, 5 * 4); anim.close()}

		//Move the values back to the robot
		for(var i = 0; i < num; i++){
			values[i].move(this.robot.x, this.robot.y, 5 * 2)
		}
		anim.close()

		//Destroy the objects
		for(var i = 0; i < num; i++){
			values[i].destroy()
		}

		//Re-enable the robot displaying
		this.robot.display(true)
		//Remove th operator
		if(operator){anim.hide(operator)}

		//Push the result to the stack
		r = new G_Value(result)
		anim.close()
		this.push(r)
	}

	//Get the item at a certain index of a list on the stack
	this.getindex = function(index, keep){
		//Disable robot displaying
		this.robot.display(false)
		//If we want to keep the list on the stack use a copy else take it from the stack
		if(keep){
			console.log(this.values)
			var list = this.values[0].copy()
		} else {
			var list = this.pull()
		}
		anim.close()

		//Move the list to the robot
		anim.opensub()
		list.move(this.robot.x, this.robot.y)
		anim.nextsub()
		list.draw()
		anim.closesub()
		anim.close()

		//Open the list
		list.extend(0)
		anim.close()

		//Go to the correct position and pick it up
		this.robot.moveTo(list.indexes[index].value)
		this.push(list.indexes[index].value.copy())
		this.robot.display(true)
		anim.close()

		//Close and remove the list
		this.robot.moveTo(list)
		list.collapse(0)
		list.destroy()
	}

	//Push an item to the stack
	this.push = function(value){
		//Move the current items down
		this.arrange(1)
		anim.close()
		//Store the item
		this.values.push(value)
		this.children.push(value)
		//Draw the item
		if(!value.visible){value.draw()}
		//Move the item to the stack
		value.move(this.x,this.y)
		value.layer(STACK_LAYER)
		anim.close()
		value.pop()
		//Give a copy to the robot
		this.robot.set(value.copy())
		anim.close()
	}

	//Pull an item from the stack
	this.pull = function(){
		//Remove it from the list
		val = this.values.pop()
		val.destroy()
		this.children.pop()
		//Move down the other values
		this.arrange()
		if(this.values.length){this.robot.set(this.values.last().copy())}
		else {this.robot.clear()}
		return val
	}

	//Empty out the values on the stack
	this.clear = function(){
		while(this.values.length){
			v = this.pull()
			v.destroy()
		}
	}

	//Rearrange the items on the stack
	this.arrange = function(off){
		if(!off){off = 0}
		for(var i = 0; i < this.values.length; i++){
			var v = this.values[this.values.length - i - 1]
			if(i < this.max){
				v.draw()
			} else {
				v.destroy()
			}
			if(v.visible){
				v.move(this.x, this.y + CELL_HEIGHT*(i+off),5 * 4)
				v.layer(STACK_LAYER)
			}
		}
	}

	this.move = function(x,y,t){
		if(x == undefined || y == undefined){
			x = this.x
			y = this.y
			t = 0
		} 
		for(var i = 0; i < this.values.length; i++){
			var v = this.values[this.values.length - i - 1]
			if(v.visible){
				v.move(x, y + CELL_HEIGHT*i,t)
				v.layer(STACK_LAYER)
			}
		}

		
		anim.move(this.objects[0],x,y,t)
		anim.move(this.objects[1], this.objects[0].upper(),t)
		anim.move(this.objects[2], this.objects[0].lower(),t)
		anim.move(this.objects[3], this.objects[0].upper(), t)
		this.x = x
		this.y = y
	}	
}

//Robot object that carries the last item on the stack and does operations
var Robot = function(){
	//Whether or not the robot is currently displaying
	this.d = true
	Graphic.call(this)
	this.objects = [new Rectangle(0, 0, ROBOT_SIZE,ROBOT_SIZE,ROBOT_COLOR,ROBOT_LAYER)]

	this.move = function(x,y,t){
		if(x == undefined){x = this.x; y = this.y; t = 0}
		else {anim.move(this.objects[0], x, y, t)}	
		if(this.children[0]){this.children[0].move(x,y,t)}
		this.x = x
		this.y = y
	}

	//Change whether or not the robot displays the last item on the stack
	this.display = function(bool){
		if(bool && this.children[0] && this.children[0].visible == false){
			this.children[0].draw()
		} else if(!bool && this.children[0] && this.children.visible == true){
			this.children[0].destroy()
		}
		this.d = bool
	}

	//Move to a certain item
	this.moveTo = function(variable){
		d = Math.floor(Math.pow(Math.pow(this.x - variable.x,2) + Math.pow(this.y - variable.y,2),0.5)/(5/5))
		this.move(variable.x, variable.y, d)

	}

	//Set the current value the robot is holding
	this.set = function(value){
		this.clear()
		this.children = [value]
		anim.opensub()
		value.layer(ROBOT_LAYER)
		value.move(this.x,this.y)
		if(!value.visible && this.d){value.draw()}
		anim.nextsub()
		value.pop()
		anim.closesub()
	}

	//Clear out the robot
	this.clear = function(){
		if(this.children[0]){this.children[0].destroy()}
		this.children = []
	}
}

Robot.prototype = Object.create(Graphic.prototype)
Stack.prototype = Object.create(Graphic.prototype)
Robot.prototype.constructor = Robot
Stack.prototype.constructor = Stack