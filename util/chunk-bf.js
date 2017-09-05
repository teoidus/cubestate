module.exports = function chunkBF (code) {
	var chunked = [];
	var offset = 0;
	
	code = code.replace(/[^+\-><\[\].,]/g, "");
	
	for (var i = 0; i < code.length; i ++) {
		if ((i - offset) % 9 == 0) {
			chunked.push("");
		}
		
		chunked[chunked.length - 1] += code[i];
		
		if (code[i] == "." || code[i] == ",") {
			offset += (i - offset) % 9
			chunked.push("");
		}
	}
	
	return chunked;
};
