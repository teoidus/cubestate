// lookup table for pruning heuristic
Cube.pruneLookup = new Uint8Array(1 << 9);
(function() {
  //var moves = [ // arrangements
  //  0b000000111, //u
  //  0b000011100, //r
  //  0b001110000, //d
  //  0b011000001, //l
  //  0b110001000, //e
  //  0b100100010  //m
  //];
  //
  //var bruteForce = function(bitmap, depth, maxdepth) {
  //  if ((depth == maxdepth) || !bitmap) { // found a minimum solution length <= maxdepth
  //    return depth;
  //  }
  //  var min = 1 << 9;
  //  for (var i = 0; i < moves.length; ++i) { // otherwise, continue brute force
  //    var subsearch = bruteForce(bitmap & ~moves[i], depth + 1, maxdepth);
  //    if (subsearch < min) {
  //      min = subsearch;
  //    }
  //  }
  //  return min;
  //}
  //
  //var bit = (bitmap, i) => (bitmap >> i) & 1;
  //for (var i = 0; i < (1 << 9); ++i) {
  //  Cube.pruneLookup[i] = bruteForce(i, 0, 4);
  //}
	for (var i = 0; i < (1 << 9); i++) {
		var s = 0;
    var map = [0, 1, 2, 5, 8, 7, 6, 3, 4];
    var bitmap = map.map((e, j) => ((i >> j) & 1) << map[j]).reduce((x, y) => x | y);
		for (var j = 8; j >= 0; j--) {
			if (j % 3) {
				s += 1 & ((bitmap >> j) | (bitmap >> (j - 1)));
			}
			if (j - 3) {
				s += 1 & ((bitmap >> j) | (bitmap >> (j - 3)));
			}
		}
		Cube.pruneLookup[i] = (s * 3) >> 3;
    //var sum = 0;
    //for (var j = 0; j < 9; ++j) {
    //}
    //  sum += (i >> j) & 1;
    //Cube.pruneLookup[i] = Math.ceil(sum / 3);
	}
})();
