// Initializes the frame drawing process.
(function() {
	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	window.requestAnimationFrame = requestAnimationFrame;
})();

// Gets visual elements from the HTML.
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

// Defines the scale (or zoom) at which to draw on the screen.
var zoom = 1;

// The active array of objects to draw on screen.
var objects = objects || [];

// Holds all values of the camera.
var camera = {
	target: -1,
	x: 0,
	y: 0,
	locked: true,
}

// Stores information about the mouse.
var mouse = {
	true_x: 0,
	true_y: 0,
	x: 0,
	y: 0,
	down: false,
	justPressed: false,
	held: false,
	turnOff: false,
}

// Processes for mouse interaction
function mouseMove(event) {
	mouse.true_x = event.x - canvas.offsetLeft;
	mouse.true_y = event.y - canvas.offsetTop;
}

function mouseUp(event) {
	mouse.turnOff = true;
	mouse.true_x = event.x - canvas.offsetLeft;
	mouse.true_y = event.y - canvas.offsetTop;
}

function mouseDown(event) {
	mouse.down = true;
	mouse.justPressed = true;
	mouse.held = false;
	mouse.true_x = event.x - canvas.offsetLeft;
	mouse.true_y = event.y - canvas.offsetTop;
}

// Variables to calculate frame-rate information.
var fps = 0;
var my_temp_date = new Date();
var temp_time = my_temp_date.getTime()

// An array of functions to be run every tick.
var Handlers = Handlers || [];

// Set a default canvas size.
setSize(1000, 800);

// The main body of the program, runs every tick (60 per second).
// Runs all main processes.
function update() {
	// Framerate calculations.
	fps ++;
	var my_temp_date = new Date();
	if (my_temp_date.getTime() - temp_time >= 1000) {
		temp_time = my_temp_date.getTime();
		fps = 0;
	}
	
	for (var f in Handlers) {
		Handlers[f]()
	}
	
	// Move camera to target.
	if (!(camera.locked || camera.target == -1)) {
		camera.x = camera.target.x;
		camera.y = camera.target.y;
	}
	
	// Calculate the upper left hand corner of the canvas, in terms of the camera.
	var camX = camera.x - canvas.width/(2*zoom);
	var camY = camera.y - canvas.height/(2*zoom);
	
	// Mouse position update
	// Convert mouse on-screen position to position within the game
	mouse.x = mouse.true_x/zoom + camX;
	mouse.y = mouse.true_y/zoom + camY;
	
	if (mouse.down && !mouse.held) {
		if (mouse.justPressed) {
			mouse.justPressed = false;
			mouse.held = true;
		}
		else {
			mouse.justPressed = true;
		}
	}
	if (mouse.turnOff) {
		mouse.down = false;
		mouse.held = false;
		mouse.justPressed = false;
		mouse.turnOff = false;
	}
	
	// Wipe the screen clear, so no buggy visuals appear.
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	
	// Draw
	for (var i in objects) {
		// Polymorphism, all different visuals run correctly.
		objects[i].draw(ctx, zoom, camX, camY);
	}	
	
	// Prepares the next frame to be called.
	requestAnimationFrame(update);
}

// Once the page has loaded, begin running the main process.
window.addEventListener("load", function() {
	update();
	
	canvas.addEventListener("mousedown", mouseDown, false);
	
	canvas.addEventListener("mouseup", mouseUp, false);
	
	canvas.addEventListener("mousemove", mouseMove, false);
});