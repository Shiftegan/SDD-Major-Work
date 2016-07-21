// Initialises these arrays if main.js hasn't already run due to loading issues
var objects = objects || [];
var Handlers = Handlers || [];

// Anchoring default
var defaultAnchor = [0, 0];

// Anchors define the "center" of a shape, ranging from top left [0, 0]
// to the bottom right [1, 1]


// The superclass for all Visuals
function Visual(x, y, colour, layer, anchor) {
	this.x = x;
	this.y = y;
	this.colour = colour || "black";
	this.layer = layer || 1;
	this.ui = false;
	this.anchor = anchor || defaultAnchor;
}

// Generic move function
Visual.prototype.move = function(x, y) {
	this.x = x;
	this.y = y;
}

// Find the upper bound of a shape
Visual.prototype.upper = function() {
	return [this.x - this.width*this.anchor[0] + this.width*0.5,
			this.y - this.height*this.anchor[1]]
}

// Find the lower bound
Visual.prototype.lower = function(){
	return [this.x - this.width*this.anchor[0] + this.width*0.5, 
			this.y - this.height*this.anchor[1] + this.height]
}

// Find the left side
Visual.prototype.left = function(){
	return [this.x - this.width*this.anchor[0], 
			this.y - this.height*this.anchor[1] + this.height*0.5]
}

// Find the right side
Visual.prototype.right = function(){
	return [this.x - this.width*(this.anchor[0] - 1), 
			this.y - this.height*(this.anchor[1] - 0.5)]
}

Visual.prototype.center = function(){
	return [this.x - this.width*(this.anchor[0] - 0.5), 
			this.y - this.height*(this.anchor[1] - 0.5)]
}

// Rectangle requires a width and height
function Rectangle(x, y, width, height, colour, layer, anchor) {
	
	// Use the inherited initialiser
	Visual.call(this, x, y, colour, layer, anchor);
	
	this.width = width;
	this.height = height;
};

// Process inheritance
Rectangle.prototype = Object.create(Visual.prototype);
Rectangle.prototype.constructor = Rectangle;

// The draw function specifically for rectangles
Rectangle.prototype.draw = function(canv, zoom, camX, camY) {
	// Find the center of the shape including the anchor
	x = this.x - this.width*this.anchor[0]
	y = this.y - this.height*this.anchor[1]
	
	canv.fillStyle = this.colour;
	if (!this.ui)
		canv.fillRect((x - camX)*zoom, (y - camY)*zoom, this.width*zoom, this.height*zoom);
	else
		canv.fillRect(x * uiScale, y * uiScale, this.width * uiScale, this.height * uiScale);

};

// The above processes on the Rectangle subclass are repeated below for all
// of the other shape classes

// Circle class
function Circle(x, y, radius, colour, layer, anchor) {
	
	// Initialise
	Visual.call(this, x, y, colour, layer, anchor);
	this.radius = radius;
	this.width = radius * 2;
	this.height = radius * 2;
};

// Inherit
Circle.prototype = Object.create(Visual.prototype);
Circle.prototype.constructor = Circle;

// Draw
Circle.prototype.draw = function(canv, zoom, camX, camY) {
	x = this.x - this.radius*2*this.anchor[0] + this.radius;
	y = this.y - this.radius*2*this.anchor[1] + this.radius;
	
	canv.fillStyle = this.colour;
	canv.beginPath();
	canv.arc((x - camX)*zoom, (y - camY)*zoom, this.radius * zoom, 0, 2*Math.PI);
	canv.fill();
}

// Polygon class
function Polygon(x, y, points, colour, layer, anchor) {
	Visual.call(this, x, y, colour, layer, anchor);
	this.points = points;
	this.weight = 1;
	var left = Infinity;
	var right = -Infinity;
	var top = Infinity;
	var bottom = -Infinity; 
	for (var i in points) {
		left = Math.min(left, points[i].x);
		right = Math.max(right, points[i].x);
		top = Math.min(top, points[i].y);
		bottom = Math.max(bottom, points[i].y);
	}
	this.width = right - left;
	this.height = bottom - top;
}

// Inherit
Polygon.prototype = Object.create(Visual.prototype);
Polygon.prototype.constructor = Polygon;

// Custom draw
Polygon.prototype.draw = function(canv, zoom, camX, camY) {
	// Recalculate width and height.
	var left = Infinity;
	var right = -Infinity;
	var top = Infinity;
	var bottom = -Infinity; 
	for (var i in this.points) {
		left = Math.min(left, this.points[i].x);
		right = Math.max(right, this.points[i].x);
		top = Math.min(top, this.points[i].y);
		bottom = Math.max(bottom, this.points[i].y);
	}
	this.width = right - left;
	this.height = bottom - top;
	
	x = this.x - this.width*this.anchor[0];
	y = this.y - this.height*this.anchor[1];
	// Line case
	if (this.points.length == 2) {
		canv.beginPath();
		canv.moveTo((x + this.points[0].x - camX)*zoom, (y + this.points[0].y - camY)*zoom);
		canv.moveTo((x + this.points[1].x - camX)*zoom, (y + this.points[1].y - camY)*zoom);
		canv.strokeStyle = this.colour;
		canv.lineWidth = this.weight;
		canv.stroke();
	}
	// Polygon case
	else {
		canv.fillStyle = this.colour;
		canv.beginPath();
		canv.moveTo((x + this.points[0].x - camX)*zoom, (y + this.points[0].y - camY)*zoom);
		if (! this.ui) {
			canv.moveTo((x + this.points[0].x - camX)*zoom, (y + this.points[0].y - camY)*zoom);
			for (var i = 1; i < this.points.length; i ++) {
				canv.lineTo((x + this.points[i].x - camX)*zoom, (y + this.points[i].y - camY)*zoom);
			}
		}
		else {
			canv.moveTo((x + this.points[0].x) * uiScale, (y + this.points[0].y) * uiScale);
			for (var i = 1; i < this.points.length; i ++) {
				canv.lineTo((x + this.points[i].x) * uiScale, (y + this.points[i].y) * uiScale);
			}
		}
		canv.closePath();
		canv.fill();
	}
}
// Text class
function Characters(x, y, text, colour, fontSize, fontFace, layer, anchor) {
	Visual.call(this, x, y, colour, layer, anchor);
	this.text = text;
	this.fontSize = fontSize || 10;
	this.fontFace = fontFace || "Arial";
	this.width = ctx.measureText(text).width;
	this.height = this.fontSize;
	this.align = "left";
}

// Inherit
Characters.prototype = Object.create(Visual.prototype);
Characters.prototype.constructor = Characters;

// Draw
Characters.prototype.draw = function(canv, zoom, camX, camY) {
	// Constructs the font as a string, eg '32 px Arial'
	if(!this.ui){
		canv.font = this.fontSize*zoom + "px " + this.fontFace;
		this.width = canv.measureText(this.text).width/zoom;
	} else {
		canv.font = this.fontSize*uiScale + "px " + this.fontFace;
		this.width = canv.measureText(this.text).width/uiScale;
	}
	
	this.height = this.fontSize;
	x = this.x - this.width*this.anchor[0];
	y = this.y - this.height*this.anchor[1] + this.height*0.8;
	
	
	canv.fillStyle = this.colour;
	canv.textAlign = this.align;
	if (!this.ui) {
		canv.fillText(this.text, (x - camX)*zoom, (y - camY)*zoom);
	} else {
		canv.fillText(this.text, x * uiScale, y * uiScale);
	}
}

