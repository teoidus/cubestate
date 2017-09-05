const Cube = require("./cube.js");

function CSCompiler () {
	this.cube = new Cube();
}

CSCompiler.prototype.compile = function (code) {
	var codestack = "";
	
	code = code.split("\n");
	
	while (!code[code.length - 1].length) {
		code = code.slice(0, code.length - 1);
	}
	
	for (var i = 0; i < code.length; i ++) {
		var line = code[i].split(" ");
		var moves = line.slice();
		
		var out = false;
		var in = false;
		
		switch (line[line.length - 1][0]) {
			case ".":
				out = true;
				moves = moves.slice(0, moves.length - 1);
				break;
			case ",":
				in = true;
				moves = moves.slice(0, moves.length - 1);
		}
		
		this.cube.apply(moves);
		
		codestack += this.cube.state.slice(0, (out || in) ? +line[line.length - 1][1] : 9).map((e) => ["+", "[", ">", "]", "<", "-"][e]).join("") + (out ? "." : in ? "," : "");
	}
	
	return codestack;
};
