const Cube = require("./cube.js");

function compile (code) {
	var cube = new Cube();
	var codestack = "";
	
	var lastFaceChars = 9;
	
	code = code.split("\n");
	
	while (!code[code.length - 1].length) {
		code = code.slice(0, code.length - 1);
	}
	
	if (+code[code.length - 1]) {
		lastFaceChars = +code[code.length - 1];
		code = code.slice(0, code.length - 1);
	}
	
	for (var i = 0; i < code.length; i ++) {
		var line = code[i].split(" ");
		var moves = line.slice();
		
		var stdout = false;
		var stdin = false;
		
		switch (line[line.length - 1][0]) {
			case ".":
				stdout = true;
				moves = moves.slice(0, moves.length - 1);
				break;
			case ",":
				stdin = true;
				moves = moves.slice(0, moves.length - 1);
		}
		
		cube.apply(moves.join(" "));
		
		console.log(moves.join(" "));
		console.log(cube.state.join("").match(/.{9}/).join("\n"));
		
		codestack += cube.state.slice(0, (stdout || stdin) ? +line[line.length - 1][1] : (i == code.length - 1) ? lastFaceChars : 9).map((e) => ["+", "[", ">", "]", "<", "-"][e]).join("") + (stdout ? "." : stdin ? "," : "");
	}
	
	return codestack;
};

module.exports = {
	compile: compile
};
