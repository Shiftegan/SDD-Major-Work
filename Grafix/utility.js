// Returns the sign of a number, +, - or 0.
function sign(x) {
	var s = -1;
	if (x > 0) {
		s = 1;
	} else if (x === 0) {
		s = 0;
	} return s;
}

// Restricts a number to a certain range such as for wrapping.
function clamp(x, low, high) {
	return Math.min(high, Math.max(low, x));
}

// Adjusts window size programmatically, rather than in the HTML.
function setSize(width, height) {
	canvas.width = width;
	canvas.height = height;
}

// Utility data type, useful for creating polygons.
function Vector(x, y) {
	return {x: x, y: y};
}

function specSort() {
	objects = objects.sort(function(a, b) {return a.layer - b.layer});
}

function destroy(obj) {
	// Remove an object from the array of actively drawn shapes.
	// Takes a single Visual or an array of Visuals.
	var i = 0;
	// Performs a linear search through the active arrays.
	while (i < objects.length) {
		// Checks if an array has been passed.
		if (obj instanceof Array) {
			// If this item in the active array is to be deleted.
			if (obj.indexOf(objects[i]) != -1) {
				objects.splice(i, 1);
				i --;
			}
		}
		// If this item is the singular item to be deleted.
		else if (objects[i] === obj) {
			objects.splice(i, 1);
			return true;
		}
		i ++;
	}
}

// Produces the smallest power of 2 which is larger than n.
function nextPowerOf2(n) {
    --n;
	// Bit-shifts the number to the right repeatedly, producing some binary number consisting of only 0's.
    n |= n >> 1;
    n |= n >> 2;
    n |= n >> 4;
    n |= n >> 8;
    n |= n >> 16;
	// Add one, to convert 11111 to 100000, an actual power of 2.
    return n + 1;
}

// A binary search through the array of actively drawn objects, finding the correct place
// For an object of layer: value, to be drawn.

// Note to self, tends to place an object of the same layer at the end of the section.
function binSearch(value) {
	var i = 0;
	if (objects.length == 0)
		return 0;
	// Iterate through a series of decreasing powers of 2.
    for (var e = nextPowerOf2(objects.length); e >= 1; e /= 2) {
		// If the position to the right of the current position by e is still inside the array:
        if (i + e < objects.length) {
			// If the object at that position is still of a smaller or equal value:
			// Note to self: single line if statement, caution when editing.
			if (objects[i + e].layer <= value)
	            i += e;
        }
    }
	// If the object at the located position is still smaller or equal, move to the right.
	if (objects[i].layer <= value) {
		return i + 1;
	}
    return i;
}

// Takes an object which is to be moved into another layer position.
function liveLayer(obj, layer) {
	obj.layer = layer;
	if (destroy(obj)){
		create(obj);
	}
}

// Provides minimal utility, preferred way to relayer objects not currently active.
// May become important if later layering processes are added. 
function deadLayer(obj, layer) {
	obj.layer = layer;
}

// Adds a given object (or array of objects) to the array of actively drawn objects.
function create(obj) {
	if (obj instanceof Array) {
		// Note to self: consider making this function recursive for arrays of arrays.
		for (var item in obj) {
			objects.splice(binSearch(obj[item].layer), 0, obj[item]);
		}
	}
	// A single object is to be added.
	else {
		// Place the object at the ideal position found with a binary search.
		objects.splice(binSearch(obj.layer), 0, obj);
	}
}