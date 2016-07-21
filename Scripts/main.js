//Pull information from HTML for later use
var textdiv = document.getElementById("textdiv");
var textarea = document.getElementById("editor");
var canvasdiv = document.getElementById("canvasdiv")

//Inputs for width and height settings
var inp_width= document.getElementById('width')
var inp_height = document.getElementById('height')

//Inputs for color settings (RGB)
var inp_red = document.getElementById('red')
var inp_green = document.getElementById('green')
var inp_blue = document.getElementById('blue')

//Setup of sliding panels
$(document).ready(function () {
	layout = $('body').layout({
		slidable:false, 
		east: {minSize: .2, maxSize: .6, size: .3, spacing_open: 10, spacing_closed: 20},
		west: {resizable: false, size: 300, spacing_open: 0, spacing_closed: 0},
		onresize: resize});
	inner = $('#inner').layout({
		resizable:false,
		south: {resizable: false, size: 95, spacing_open: 0, spacing_closed: 0, initClosed: true},
		onresize: resize})
	resize()

	//Bind setting button to opening settings panel
	inner.addToggleBtn('#settings','south') 
	layout.addToggleBtn('#help','west')
	layout.addToggleBtn('#closehelp','west')
});


//Change Grafix's default anchoring to a center anchor
defaultAnchor = [0.5, 0.5]


//Storage of currently pressed keys to handle zooming
keys = {}

//Adds listener for when a key is pressed
document.body.addEventListener("keydown", function(e) {
	keys[e.keyCode] = true;

	//If key is spacebar and currently not typing in editor pause/resume the animation
	if (e.keyCode == 32 && !editor.isFocused()){
		if(anim.active){
			stop()
		} else {
			start()
		}
	}
});

//Adds listener for when key is released
document.body.addEventListener("keyup", function(e) {
	keys[e.keyCode] = false;
});

//Function called whenever the canvas is resized (by dragging panel or changing browser window size)
function resize(){
	//Make the canvas size fit its container
	canvas.width = canvasdiv.clientWidth
	canvas.height = canvasdiv.clientHeight
	//Resize the UI
	ui.resize()
	//Resize the editor
	editor.resize()
}

//Get Ace Editors' range function for ease of use
var Range = ace.require('ace/range').Range;

//Add Ctrl+Enter as an alternative way to submit code
editor.$blockScrolling = Infinity
editor.commands.addCommand({
    name: 'submit',
    bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
    exec: function(editor) {
        main.submit()
    },
    readOnly: true // false if this command should not apply in readOnly mode
});

//Storage for values that must be placed on grid
values = []

//Storage for markers placed when an error is found
markers = []

//Function that tells the UI if a click has occured
var UI_update = function(){
	if(mouse.justPressed){
		ui.click()
	}
}

//If the + or - keys are pressed and the editor isnt being used zoom in or out
var zoom = function(){
	if(!editor.isFocused()){
		if (keys[187] || keys[107]){
			zoom += 0.1
		}
		if ((keys[189] || keys[109]) && zoom >= 1){
			zoom -= 0.1
		}
	}
}


//Main object that handles all the other objects
var Main = function(){

	//Function that resets all the main objects
	this.reset = function(){
		//Stop currrent animator
		stop()
		//Clear screen
		objects = []
		//Clear error markers
		for(var i = 0; i < markers.length; i++){editor.session.removeMarker(markers[i])}
		//Make new animator and UI
		anim = new Animator()
		ui = new UI()
		//Make new grid using settings inputs as parameters
		this.grids = [new G_Grid(Number(inp_width.value),Number(inp_height.value),[Number(inp_red.value),Number(inp_green.value),Number(inp_blue.value)])]
		//New intepreter paired with this grid
		this.interpreter = new Interpreter(this.grids[0])
		//Move the new grids robot to the starting position
		this.grids[0].stack.robot.move(0,0)
	}
	
	//Submits the users code, called when button pressed or ctrl+enter used
	this.submit = function(){
		//Reset objects
		this.reset()
		//Create a new parser on the editor's text
		parser = new Parser(new Lexer(editor.getValue()))
		//Parser the text into an AST
		try{
			data = parser.parse()
			//Seperate into the tree and the values that need to be laid out
			tree = data[0]
			values = data[1]
		}
		catch(e){
			//If failed to run print the error and replace the tree with no operation
			ui.write(e)
			values = []
			tree = new NoOp()
		}
		
		//Populate grid with the values and draw it
		this.grids[0].populate(values)
		this.grids[0].draw(0,0)

		//Set the camera to target the middle cell
		camera.target = this.grids[0].cells[Math.floor(this.grids[0].width/2)-1][Math.floor(this.grids[0].height/2)].objects[0]
		anim.close()
		//Get interpreter to interpret the AST
		try{
			this.interpreter.visit(tree)
		}
		catch(e){
			ui.write(e)
		}
		//Start animation
		start()
	}

	//Create startup objects
	anim = new Animator()
	ui = new UI()
	this.grids = [new G_Grid(Number(inp_width.value),Number(inp_height.value),[Number(inp_red.value),Number(inp_green.value),Number(inp_blue.value)])]
	this.grids[0].populate()
	this.grids[0].draw(0,0)
	camera.target = this.grids[0].cells[Math.floor(this.grids[0].width/2)-1][Math.floor(this.grids[0].height/2)].objects[0]
	start()
	
}


//Unlock camera so it can focus on middle cell
camera.locked = false

//Push the UI_update and zoom functions to be run by Grafix every tick
Handlers.push(UI_update)
Handlers.push(zoom)

//Set the zoom layers
zoom = 2
uiScale = 1

//Create main object
main = new Main()

