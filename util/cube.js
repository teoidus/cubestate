function Cube () {
	// U is 0
	// L is 1
	// F is 2
	// R is 3
	// B is 4
	// D is 5
	this.state = [
		0, 0, 0, 0, 0, 0, 0, 0, 0,
		1, 1, 1, 1, 1, 1, 1, 1, 1,
		2, 2, 2, 2, 2, 2, 2, 2, 2,
		3, 3, 3, 3, 3, 3, 3, 3, 3,
		4, 4, 4, 4, 4, 4, 4, 4, 4,
		5, 5, 5, 5, 5, 5, 5, 5, 5
	];
}

// For each value in the move array, newstate[index_of_value] = oldstate[value]
// For inverse moves, newstate[value] = oldstate[index_of_value]
// Copying cubid's method: All moves can be represented in terms of U, x, and y
Cube.moves = {
	"U": [
		6, 3, 0, 7, 4, 1, 8, 5, 2,
		18, 19, 20, 12, 13, 14, 15, 16, 17,
		27, 28, 29, 21, 22, 23, 24, 25, 26,
		36, 37, 38, 30, 31, 32, 33, 34, 35,
		9, 10, 11, 39, 40, 41, 42, 43, 44,
		45, 46, 47, 48, 49, 50, 51, 52, 53
	],
	"x": [
		18, 19, 20, 21, 22, 23, 24, 25, 26,
		11, 14, 17, 10, 13, 16, 9, 12, 15,
		45, 46, 47, 48, 49, 50, 51, 52, 53, 
		33, 30, 27, 34, 31, 28, 35, 32, 29,
		8, 7, 6, 5, 4, 3, 2, 1, 0, 
		44, 43, 42, 41, 40, 39, 38, 37, 36
	],
	"y": [
		6, 3, 0, 7, 4, 1, 8, 5, 2,
		18, 19, 20, 21, 22, 23, 24, 25, 26,
		27, 28, 29, 30, 31, 32, 33, 34, 35,
		36, 37, 38, 39, 40, 41, 42, 43, 44,
		9, 10, 11, 12, 13, 14, 15, 16, 17,
		47, 50, 53, 46, 49, 52, 45, 48, 51,
	],
	"F": "x U x'",
	"R": "y F y'",
	"L": "y' F y",
	"D": "x F x'",
	"B": "y R y'",
	"z": "x y x'",
	"f": "B z",
	"r": "L x",
	"u": "D y",
	"l": "R x'",
	"d": "U y'",
	"b": "F z'",
	"M": "l L'",
	"E": "d D'",
	"S": "f F'"
};

Cube.prototype.apply = function (moves, isInverse) {
	moves = moves.split(" ");
	isInverse = isInverse || false;
	
	if (isInverse) {
		moves.reverse();
	}
	
	for (var i = 0; i < moves.length; i ++) {
		var move = moves[i];
		
		if (!move) {
			continue;
		}
		
		switch (move[move.length - 1]) {
			case "'":
				this.applyMove(move[0], !isInverse);
			break; case "2":
				this.applyMove(move[0]);
				this.applyMove(move[0]);
			break; default:
				this.applyMove(move, isInverse);
		}
	}
};

Cube.prototype.applyMove = function (raw, isInverse) {
	var move = Cube.moves[raw];
	isInverse = isInverse || false;
	
	if (typeof move == "string") {
		return this.apply(move, isInverse);
	}
	
	var newState = this.state.slice();
	
	for (var i = 0; i < move.length; i ++) {
		if (isInverse) {
			newState[move[i]] = this.state[i];
		} else {
			newState[i] = this.state[move[i]];
		}
	}
	
	this.state = newState;
}

module.exports = Cube;
