module.exports = function chunkBF (code) {
	var chunked = [];
	
	code = code.replace(/[^+\-><\[\].,]/g, "");
	
	for (var i = 0; i < code.length; i ++) {
		if (i % 9 == 0) {
			chunked.push("");
		}
		
		chunked[chunked.length - 1] += code[i];
		
		if (code[i] == "." || code[i] == ",") {
			chunked.push("");
		}
	}
	
	return chunked;
};
