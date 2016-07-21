UI_SIZE = canvas.width/20
UI_MARGIN = UI_SIZE/5
UI_LAYER = 1000
UI_COLOR = "rgba(150,150,150,0.5)"

//Main UI Handler
var UI = function(){

	//Function to set up UI objects
	this.getObjects = function(){
		this.objects = [{
							"name":"rewind",
							"object": new Polygon(0,0,[{"x":UI_SIZE,"y":UI_SIZE},{"x":UI_SIZE,"y":0},{"x":UI_SIZE/2,"y":UI_SIZE/2},{"x":UI_SIZE/2,"y":0},{"x":0,"y":UI_SIZE/2},{"x":UI_SIZE/2,"y":UI_SIZE},{"x":UI_SIZE/2,"y":UI_SIZE/2}],UI_COLOR,UI_LAYER,[0,1]),
							"function":function(){ui.addspeed(-1)}
						},
						{
							"name":"play",
							"object": new Polygon(0,0,[{"x":0,"y":0},{"x":0,"y":UI_SIZE},{"x":UI_SIZE,"y":UI_SIZE/2}],UI_COLOR,UI_LAYER,[0,1]),
							"function":start
						},
						 {
						 	"name":"stop",
							"object": new Rectangle(0,0,UI_SIZE,UI_SIZE,UI_COLOR,UI_LAYER,[0,1]),
						 	"function":stop
						 },
						 {
							"name":"fastforward",
							"object": new Polygon(0,0,[	{"x":0,"y":0},{"x":0,"y":UI_SIZE},{"x":UI_SIZE/2,"y":UI_SIZE/2},{"x":UI_SIZE/2,"y":UI_SIZE},
														{"x":UI_SIZE,"y":UI_SIZE/2},{"x":UI_SIZE/2,"y":0},{"x":UI_SIZE/2,"y":UI_SIZE/2}],
														UI_COLOR,UI_LAYER,[0,1]),
							"function": function(){ui.addspeed(1)}
						},
						{},{},{},{},{},{},{},{},{},{},{}, 
						 {
						 	"name":"speed",
						 	"object": new Characters(0,0, Math.floor(Math.abs(anim.speed)) + "x", UI_COLOR, UI_SIZE, FONT, UI_LAYER,[0,1])
						 }]
						 //this.objects[16].object.align = "right"
	}
	this.objects = []

	//Function called when the screen is resized
	this.resize = function(){
		//Setup the size of the objects to match new screen width
		UI_SIZE = canvas.width/20
		//Destroy the current objects
		for(var i = 0; i < this.objects.length; i++){
			destroy(this.objects[i].object)
		}
		//Get new objects
		this.getObjects()
		//Move them to new position and set them as ui
		for(var i = 0; i < this.objects.length; i++){
			if(this.objects[i].object){
				this.objects[i].object.ui = true
				create(this.objects[i].object)
				this.objects[i].object.move(UI_MARGIN + i * (UI_SIZE + UI_MARGIN), canvas.height - UI_MARGIN)
			}
		}
	}

	//Function called when the screen is clicked
	this.click = function(){
		//Mathematically determine which object was clicked
		if(mouse.true_y > canvas.height - UI_SIZE){
			var i = Math.floor((mouse.true_x - UI_MARGIN) / (UI_SIZE + UI_MARGIN))
			if(i > -1 && i < this.objects.length && this.objects[i].function){
				//Call its function
				this.objects[i].function()
			}
		}
	}

	//Function to add speed to the animation
	this.addspeed = function(num){
		//Change animation speed
		anim.addspeed(num)
		//Change the text on the object displaying the speed
		this.objects.last().object.text = String(Math.floor(Math.abs(anim.speed))) + "x"
	}

	//function to write message to the screen
	this.write = function(msg){
		if(this.msg){destroy(this.msg)}
		this.msg = new Characters(3,3,msg, "rgb(200,150,150)", UI_SIZE*0.7, FONT, UI_LAYER, [0,0])
		this.msg.ui = true
		create(this.msg)
	}

	this.resize()
}