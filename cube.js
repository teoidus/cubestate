Object.defineProperty(Array.prototype, 'chunk_inefficient', {
    value: function(chunkSize) {
        var array=this.slice();
        return [].concat.apply([],
            array.map(function(elem,i) {
                return i%chunkSize ? [] : [array.slice(i,i+chunkSize)];
            })
        );
    }
});

function Cube () {
	// Indices
	/*
		 00 01 02
		 03 04 05  U
		 06 07 08
	36 37 38 09 10 11 18 19 20
    L	39 40 41 12 13 14 21 22 23  R
	42 43 44 15 16 17 24 25 26
		 45 46 47
		 48 49 50  D
		 51 52 53
		 35 34 33
		 32 31 30  B (upside down because net)
		 29 28 27
	*/
	
	// U is 0
	// F is 1
	// R is 2
	// B is 3
	// L is 4
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
		9, 10, 11, 12, 13, 14, 15, 16, 17,
		45, 46, 47, 48, 49, 50, 51, 52, 53,
		24, 21, 18, 25, 22, 19, 26, 23, 20,
		0, 1, 2, 3, 4, 5, 6, 7, 8,
		38, 41, 44, 37, 40, 43, 36, 39, 42,
		35, 34, 33, 32, 31, 30, 29, 28, 27
	],
	"y": [
		6, 3, 0, 7, 4, 1, 8, 5, 2,
		18, 19, 20, 21, 22, 23, 24, 25, 26,
		27, 28, 29, 30, 31, 32, 33, 34, 35,
		36, 37, 38, 39, 40, 41, 42, 43, 44,
		9, 10, 11, 12, 13, 14, 15, 16, 17,
		47, 50, 53, 46, 49, 52, 45, 48, 51
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

Cube.prototype.apply = function (moves) {
	moves = moves.split(" ");
	
	for (var i = 0; i < moves.length; i ++) {
		var move = moves[i];
		
		switch (move[move.length - 1]) {
			case "'":
				move = move.slice(0, move.length - 1);
				this.applyMove(move, true);
			break; case "2":
				move = move.slice(0, move.length - 1);
				this.applyMove(move);
				this.applyMove(move);
			break; default:
				this.applyMove(move);
		}
	}
};

Cube.prototype.applyMove = function (raw, isInverse) {
	var move = Cube.moves[raw];
	
	if (typeof move == "string") {
		return this.apply(move);
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
	
	this.printState(this.state);
	console.log("----");
}

Cube.prototype.printState = function () {
	console.log(this.state.slice().chunk_inefficient(9).join("\n"));
};

module.exports = Cube;
