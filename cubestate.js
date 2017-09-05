const Cube = require("./util/cube.js");

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
		
		codestack += cube.state.slice(0, (stdout || stdin) ? +line[line.length - 1][1] : (i == code.length - 1) ? lastFaceChars : 9).map((e) => ["+", "[", ">", "]", "<", "-"][e]).join("") + (stdout ? "." : stdin ? "," : "");
	}
	
	return codestack;
}

function chunkBF (code) {
	var chunked = [""];
	
	for (var i = 0; i < code.length; i ++) {
		if (chunked[chunked.length - 1].length == 9) {
			chunked.push("");
		}
		
		chunked[chunked.length - 1] += code[i];
		
		if (code[i] == "." || code[i] == ",") {
			chunked.push("");
		}
	}
	
	while (!chunked[chunked.length - 1].length) {
		chunked = chunked.slice(0, chunked.length - 1);
	}
	
	return chunked;
}

function generateCS (code) {
	var chunked = chunkBF(code.replace(/[^+\-><[\].,]/g, "")).map((e) => e
		.replace(/\+/g, "0")
		.replace(/\[/g, "1")
		.replace(/>/g, "2")
		.replace(/]/g, "3")
		.replace("<", "4")
		.replace("-", "5"));
	var cube = new Cube();
	
	for (var i = 0; i < chunked.length; i ++) {
		var chunk = chunked[i];
		
		console.log(chunk);
	}
}

module.exports = {
	chunkBF: chunkBF,
	compile: compile,
	generateCS: generateCS
};
