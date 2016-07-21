//Objects storing the properties of each of the actions that could be applied to an item on the screen so that they can be played back later

//Movement object
var Move = function(o,x,y,t){
	this.object = o
	this.x = x
	this.y = y
	this.time = Math.floor(t)
	if(!this.time || this.time < 1){
		this.time = 1
	}
	
	this.points = []
	dx = (this.x - this.object.x)/this.time
	dy = (this.y - this.object.y)/this.time
	for(var i = 0; i < this.time + 1; i++){
		this.points.push([this.object.x + dx*i, this.object.y + dy*i])
	}
	this.forward = function(p){
		this.object.move(this.points[p][0], this.points[p][1])
	}
	this.reverse = function(p){
		this.object.move(this.points[p][0], this.points[p][1])
	}
}

//Hiding object
var Hide = function(o){
	this.time = 1
	this.objects = o
	this.forward = function(p){
		destroy(this.objects)
	}
	this.reverse = function(p){
		create(this.objects)
	}
}

//Showing object
var Show = function(o){
	this.time = 1
	this.objects = o
	this.forward = function(p){
		create(this.objects)
	}
	this.reverse = function(p){
		destroy(this.objects)
	}
}

//Re-sizing object
var Size = function(o, values, t){ //width, height, target_width, target_height
	this.time = t
	if(this.time < 1){this.time = 1}
	this.object = o
	this.values = values
	this.forward = function(p){
		this.object.width = this.values[0] + ((this.values[2] - this.values[0])/t)*p
		this.object.height = this.values[1] + ((this.values[3] - this.values[1])/t)*p
	}
	this.reverse = function(p){
		this.object.width = this.values[0] + ((this.values[2] - this.values[0])/t)*p
		this.object.height = this.values[1] + ((this.values[3] - this.values[1])/t)*p
	}
}

//Popping object
var Pop = function(o,s,t){
	this.object = o
	this.size = s
	this.time = Math.floor(t)
	if(this.time < 2){this.time = 2}
	this.frames = Math.floor(this.time/2)
	this.getPoints = function(){
		d = this.size/this.frames/2
		this.points = []
		for(var i = 0; i < this.frames + 1; i++){
			this.points.push([this.object.x - (i*d)/2, this.object.y - (i*d)/2, this.object.width + (i*d), this.object.height + (i*d)])
		}
	}
	this.forward = function(p){
		if(!this.points){this.getPoints()}
		if(p < this.frames){
			this.object.move(this.points[p][0], this.points[p][1])
			this.object.width = this.points[p][2]
			this.object.height = this.points[p][3]
		} else {
			p = this.points.length*2 - p - 2
			this.object.move(this.points[p][0], this.points[p][1])
			this.object.width = this.points[p][2]
			this.object.height = this.points[p][3]
		}
	}
	this.reverse = function(p){
		if(p < this.frames){
			this.object.move(this.points[p][0], this.points[p][1])
			this.object.width = this.points[p][2]
			this.object.height = this.points[p][3]
		} else {
			p = this.points.length*2 - p - 2
			this.object.move(this.points[p][0], this.points[p][1])
			this.object.width = this.points[p][2]
			this.object.height = this.points[p][3]
		}
	}
}

//Re-Layering object
var Layer = function(o, layer){
	this.start = []
	this.objects = o
	this.layer = layer
	this.time = 1
	this.forward = function(p){
		for (var i = 0; i < this.objects.length; i++){
			this.start[i] = this.objects[i].layer
			liveLayer(this.objects[i], this.objects[i].layer%10 + this.layer)
		}
	}
	this.reverse = function(p){
		for (var i = 0; i < this.objects.length; i++){
			liveLayer(this.objects[i], this.start[i])
		}
	}
}

//Function to set the animation object to active and setting it to update each tick
var start = function(){
	if(!anim.active){
		Handlers.push(anim_update)
		anim.active = true
	}
}

//Function to set the animation object to inactive and removing it from updating
var stop = function(){
	var index = Handlers.indexOf(anim_update)
	if(index != -1){
		Handlers.splice(index, 1)
	}
	anim.active = false
}

//Function that is pushed to  cause the animation object to update
var anim_update = function(){
	anim.update()
}

//Subframe that allows multiple action to take place in sequence within one frame e.g. show then move
var SubFrame = function(){
	this.actions = [new Frame()]
	this.time = 0
	this.push = function(action){
		this.actions.last().push(action)
	}
	this.next = function(action){
		this.time += this.actions.last().time
		this.actions.push(new Frame())
	}
	this.close = function(){
		this.time += this.actions.last().time
	}
	this.forward = function(frame){
		var t = 0
		var i = 0
		while(this.actions[i].time + t < frame){
			t += this.actions[i].time
			i += 1
		}
		this.actions[i].forward(frame - t)

	}
	this.reverse = function(frame){
		var t = 0
		var i = 0
		while(this.actions[i].time + t < frame){
			t += this.actions[i].time
			i += 1
		}
		this.actions[i].reverse(frame - t)
	}
}


//Main frame object that stores a list of actions to take place simultaneously e.g. move all the value objects
var Frame = function(){
	this.time = 0
	this.actions = []
	this.push = function(o){
		this.actions.push(o)
		if(o.time > this.time){this.time = o.time}
	}
	this.forward = function(p){
		for(var i = 0; i < this.actions.length; i++){
			if(p <= this.actions[i].time){
					this.actions[i].forward(p)
			}
		}
	}
	this.reverse = function(p){
		for(var i = 0; i < this.actions.length; i++){
			if(p <= this.actions[i].time){
					this.actions[i].reverse(p)
			}
		}
	}
}

//Main animation object that handles the other frame objects
var Animator = function(){
	this.frames = [new Frame()]
	
	this.delay = 0
	this.delay_frame = 0
	this.speed = 1
	this.sub = false
	
	this.active = false

	this.start_frame = 1
	this.cur_frame = 0
	this.time_frame = 1
	
	this.time_start = 0
	this.time = 0

	//Add speed relative to other speed
	this.addspeed = function(speed){
		this.setspeed(this.speed + speed)
	}

	//Set speed to a specific value
	this.setspeed = function(speed){
		this.speed = speed
		if(speed < 1 && this.speed > -1){
			this.delay = 1/Math.abs(speed) - 1
		} else {
			this.delay = 0
		}
	}

	//Go to a specific frame
	this.gotoframe = function(target){
		if(target < this.time_start){
			target = this.time_start
		}
		while(this.time != target){
			if (target < this.time){
				this.reverse()
			} else {
				this.forward()
			}
		}
	}

	//Start a sub frame
	this.opensub = function(){
		this.sub = new SubFrame()
	}

	//Move to next frame of the subframe
	this.nextsub = function(){
		this.sub.next()
	}

	//Close the sub frame
	this.closesub = function(){
		this.sub.close()
		this.frames.last().push(this.sub)
		this.sub = false
	}

	//Push an action to the current frame/subframe
	this.push = function(o){
		if(this.sub){
			this.sub.push(o)
		} else {
			this.frames.last().push(o)
		}
	}

	//Push a move action
	this.move = function(o, x, y, t){
		if(x instanceof Array){
			t = y
			y = x[1]
			x = x[0]
		}
		this.push(new Move(o,x,y,t))
		o.move(x,y)
	}

	//Push a hide action
	this.hide = function(o){
		this.push(new Hide(o))
	}

	//Push a show action
	this.show = function(o){
		this.push(new Show(o))
	}

	//Push a pop action
	this.pop = function(o,s,t){
		this.push(new Pop(o,s,t))
	}

	//Push a re-layer action
	this.layer = function(o,layer){
		this.push(new Layer(o,layer))
	}

	//Push a re-size action
	this.size = function(o,sizes,t){
		this.push(new Size(o,sizes,t))
	}

	//Close the current frame and push a new one
	this.close = function(){
		if (this.frames.last().actions.length){this.frames.push(new Frame())}
	}

	//Progress the animation forward or backward based on speed
	this.update = function(){
		for(var i = 0; i < Math.abs(this.speed); i++){
			if(this.delay_frame % this.delay == 0 || this.delay == 0){
				this.delay_frame = 0

				//If speed is positive move forward
				if(this.speed > 0){
					this.forward()
				//Otherwise move backwards
				} else {
				if(this.speed < 0){
					this.reverse()
				}}
			}
			this.delay_frame += 1
		}
	}

	//Move animation forward
	this.forward = function(){
		//Call the current frame to move each of its actions forward
		this.frames[this.cur_frame].forward(this.time_frame)
		//If we have reached the end of the frame
		if(this.time_frame == this.frames[this.cur_frame].time){
			//Go to the next frame
			this.cur_frame += 1
			//If its the last frame
			if(this.cur_frame > this.frames.length - 1){
				//Stop the animation and set the position to the previous frame in case of trying to play again
				this.cur_frame = this.frames.length - 1
				this.time_frame = this.frames[this.cur_frame].time
				stop()
				return false
			} else {
				this.time_frame = 0
			}
		}
		this.time_frame += 1
		this.time += 1
	}

	//Identical function that moves animation backwards
	this.reverse = function(){
		this.frames[this.cur_frame].reverse(this.time_frame)
		if(this.time_frame == 0){
			this.cur_frame -= 1
			if(this.cur_frame < this.start_frame){
				this.cur_frame = this.start_frame
				this.time_frame = 1
				stop()
			} else {	
				this.time_frame = this.frames[this.cur_frame].time + 1
			}
		}
		this.time_frame -= 1
		this.time -= 1
	}
}
