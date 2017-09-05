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
		
		this.cube.apply(moves);
		
		codestack += this.cube.state.slice(0, (stdout || stdin) ? +line[line.length - 1][1] : 9).map((e) => ["+", "[", ">", "]", "<", "-"][e]).join("") + (stdout ? "." : stdin ? "," : "");
	}
	
	return codestack;
};

module.exports = CSCompiler;
