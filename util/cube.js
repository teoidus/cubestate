const DEBUG = true;
const MAX_SEARCH_DEPTH = 100;
Cube.DEBUG = DEBUG;

function Cube() {
  // The cube is represented as Uint32Array[6]. Each item in the array corresponds to stickers on a face:
  //  cube = [U, L, F, R, B, D]
  // Each sticker holds a value 0..5, and therefore takes 3 bits.
  // (In a sense, each face is a 9 digit octal number with digit values restricted to 0..5)
  // Here are the bit positions of the stickers on each face:
  //  0  3  6
  // 21 24  9
  // 18 15 12
  // The clockwise layout is advantageous here, since ccw rotation of a face is equivalent to:
  // (rotators >> 6) | (double << 18) | center, where:
  //   rotators = face & 0o077777700
  //   double   = face & 0o000000077
  //   center   = face & 0o700000000
  // Similarly, cw rotation of a face is equivalent to:
  // (double >> 18) | (rotators << 6) | center, where:
  //   rotators = face & 0o000777777
  //   double   = face & 0o077000000
  //   center   = face & 0o700000000
  
  // To complete rotation of a face on a physical cube, we must also cycle groups of 3 stickers on 4 faces.
  // (e.g. a U move sends stickers on F to L to B to R to F)
  
  // The 4-cycle for a U move can be done as follows:
  //   tmp = F & 0o777;
  //   F = (F & 0o777777000) | (R & 0o777);
  //   R = (R & 0o777777000) | (B & 0o777);
  //   B = (B & 0o777777000) | (L & 0o777);
  //   L = (L & 0o777777000) | tmp;
  
  // Two issues arise for L moves or slices:
  // 1. When shifting stickers from B to U, their order must be reversed.
  //   We could solve this with the help of 1 lookup table, flip[],
  //   which maps 3 digit octals to octals with digits reversed:
  //     flip[0oABC] = 0oCBA.
  //   This lookup table would be 2^9 entries * 2 bytes/entry = 1 KB in size.
  // 2. Not all 3-sticker groups are consecutive bitfields.
  // (e.g. an L move affects bits 0, 21, and 18 on U.)
  //   We could solve this with the help of 1 lookup table, arrange[][],
  //   which maps 3 digit octals and 1 "arrangement" (a number from 0..5) to the proper places:
  //     Arrangement 0   1   2   3   4   5
  //                 ABC ..A ... C.. ... .A. 
  //                 ... ..B ... B.. ABC .B. 
  //                 ... ..C CBA A.. ... .C. 
  //     arrange[0oCBA][3] = 0o0BA00000C (indices are little endian, so 0oCBA is actually ABC)
  
  // To avoid an extra layer of indirection at the expense of additional memory,
  // we can combine both of these solutions into a large lookup table arrange[][].
  //   We simply define 6 additional arrangements that reverse the digits of the key:
  //     Arrangement 0   1   2   3   4   5   6   7   8   9   10  11
  //                 ABC ..A ... C.. ... .A. CBA ..C ... A.. ... .C.
  //                 ... ..B ... B.. ABC .B. ... ..B ... B.. CBA .B.
  //                 ... ..C CBA A.. ... .C. ... ..A ABC C.. ... .A.
  //     arrange[0oCBA][4] = 0oBA000C000
  //   This lookup table is 2^9*12 entries * 4 bytes/entry = 24 KB in size.
  
  // Now there's one final issue to address: sticker arrangements still have to be
  // transformed into a 3 digit octal key for lookup in arrange[]. Transformations are as follows:
  // Arrangement  Key isolation
  // 0            bitmap & 0o777
  // 1            (bitmap >> 6) & 0o777
  // 2            (bitmap >> 12) & 0o777
  // 3            ab | c where ab = (bitmap >> 18) & 0o77, c = (bitmap & 0o7) << 6
  // 4            ab | c where ab = bitmap >> 21, c = (bitmap >> 3) & 0o700
  // 5            a | b | c where a = (bitmap >> 3) & 0o7, b = bitmap >> 24, c = (bitmap >> 9) & 0o700
  
  // Now, the 4-cycle for an L move is possible:
  //   var tmp = F & 0o777;
  //   F = (F & 0o700777770) | (U & 0o077000007);
  //   U = (U & 0o700777770) | arrange[(B >> 6) & 0o777][9];
  //   B = (B & 0o777700077) | arrange[((D >> 18) & 0o77) | ((D & 0o7) << 6)][7];
  //   D = (D & 0o700777770) | (F & 0o077000007);
  
  // In total, then, an L move will look like this:
  //   var rotators = face & 0o000777777;
  //   var double   = face & 0o077000000;
  //   var center   = face & 0o700000000;
  //   L = (double >> 18) | (rotators << 6) | center;
  //
  //   var tmp = F & 0o777;
  //   F = (F & 0o700777770) | (U & 0o077000007);
  //   U = (U & 0o700777770) | arrange[(B >> 6) & 0o777][9];
  //   B = (B & 0o777700077) | arrange[((D >> 18) & 0o77) | ((D & 0o7) << 6)][7];
  //   D = (D & 0o700777770) | (F & 0o077000007);
  
  // This specific example uses:
  //   12 4
  //   6 |, 2 | for 2d array access
  //   5 bitshifts, 2 << for 2d array access (multiply by 2^9)
  //   2 array accesses
  //   10 stores, ~19 temporary stores for intermediate values?
  // => ~60 basic operations
  
  // For reference, the index map code:
  // move = move << 6;
  // var oldPtr = this.statePtr | 0;
  // this.statePtr ^= this.stateFlipper;
  // var i = 54;
  // while (i--) {
  //   this.state[this.statePtr + Cube.moves[move | i]] = this.state[oldPtr + i];
  // }
  
  // This uses:
  //   1 <<
  //   55 |
  //   1 ^
  //   54 decrements
  //   54 jz
  //   108 +
  //   162 array accesses
  //   58 stores, ~162 temporary stores for intermediate values?
  // => ~655 basic operations
  
  // To avoid writing bitwise code like the above for each possible move in <U,L,F,R,B,D,M,E,S>,
  // we'll define, parse, and compile the following language to javascript code, and insert that code
  // into Cube.apply():
  //   Each new line is a case block w/ format "m (face|slice): wa (->|~>) xb (->|~>) yc (->|~>) zd (->|~>)", where:
  //     m = move type (e.g. U, R, M)
  //     face = is face move
  //     slice = is slice move
  //     w, x, y, z = face names in "sent to" order
  //       e.g. for U, w x y z = F L B R (read as "F sent to L sent to ...")
  //     a, b, c, d = arrangement names in "sent to" order
  //       Arrangements 0, 1, 2, 3, 4, 5 have names u, r, d, l, e, m
  //       e.g. for U, a b c d = u u u u
  //     -> = the stickers are sent in normal order
  //     ~> = the stickers are sent in reverse order
  //   e.g. the following description of an L move will compile to the JS example written above:
  //     L face: Ul -> Fl -> Dl ~> Br ~>
  
  this.state = Uint32Array.from([
    0o111111111,
    0o222222222,
    0o333333333,
    0o444444444,
    0o555555555,
    0o666666666
  ]);
}

// the set of moves supported directly by Cube.applyMove()
Cube.basicMoves = [
  "U", "L", "F", "R", "B", "D", "M", "E", "S",
  "U'", "L'", "F'", "R'", "B'", "D'", "M'", "E'", "S'",
  "U2", "L2", "F2", "R2", "B2", "D2", "M2", "E2", "S2"
];

// the axes of rotation of basic moves. 0, 1, 2 = x, y, z
Cube.axes = Uint8Array.from([
  1, 0, 2, 0, 2, 1, 0, 1, 2, // U, R, F, L, B, D, M, E, S
  1, 0, 2, 0, 2, 1, 0, 1, 2, // inverses
  1, 0, 2, 0, 2, 1, 0, 1, 2, // doubles
]);

// the types of basic moves. type[R] == type[R'] == type[R2]
Cube.types = Uint8Array.from([
  0, 1, 2, 3, 4, 5, 6, 7, 8, // U, R, F, L, B, D, M, E, S
  0, 1, 2, 3, 4, 5, 6, 7, 8, // inverses
  0, 1, 2, 3, 4, 5, 6, 7, 8, // doubles
]);

// lookup table to invert basic moves. invert[R] == R', invert[R2] == R2
Cube.invert = Uint8Array.from([
  9, 10, 11, 12, 13, 14, 15, 16, 17, // normals become inverses
  0, 1, 2, 3, 4, 5, 6, 7, 8,         // inverses become normal
  18, 19, 20, 21, 22, 23, 24, 25, 26 // doubles stay doubles
]);

// the set of all possible moves and their implementations w.r.t. basic moves
Cube.moves = {
  "U": 0, "L": 1, "F": 2, "R": 3, "B": 4, "D": 5, "M": 6, "E": 7, "S": 8, // basic moves
  "U'": 9, "L'": 10, "F'": 11, "R'": 12, "B'": 13, "D'": 14, "M'": 15, "E'": 16, "S'": 17,
  "U2": 18, "L2": 19, "F2": 20, "R2": 21, "B2": 22, "D2": 23, "M2": 24, "E2": 25, "S2": 26,
  
  "x": "L' M' R", "y": "U E' D'", "z": "F S B'", // compound singles
  "u": "U E'", "l": "L M", "f": "F S", "r": "R M'", "b": "B S'", "d": "D E",
  
  "x2": "L2 M2 R2", "y2": "U2 E2 D2", "z2": "F2 S2 B2", // compound doubles
  "u2": "U2 E2", "l2": "L2 M2", "f2": "F2 S2", "r2": "R2 M2", "b2": "B2 S2", "d'": "D2 E2",
  
  "x'": "L M R'", "y'": "U' E D", "z'": "F' S' B", // compound inverses
  "u'": "U' E", "l'": "L' M'", "f'": "F' S'", "r'": "R' M", "b'": "B' S", "d'": "D' E'",
};

// applies a string move sequence (e.g. R u f B d')
Cube.prototype.apply = function(moves, isInverse) {
  moves = moves.split(/\s+/);
  isInverse = isInverse || false;

  if (isInverse) {
    moves.reverse();
  }

  var ptr = this;
  moves.map(e => e ? ptr.applyMove(e, isInverse) : false);
};

// applies a single string move
Cube.prototype.applyMove = function(move, isInverse) {
  var move = Cube.moves[move];

  isInverse = isInverse || false;

  return (typeof move == "string") ?
    this.apply(move, isInverse) :
    this.applyBasicMove(isInverse ? Cube.invert[move] : move);
};

// initialize Cube.arrange[] and Cube.applyBasicMove()
Cube.arrange = new Uint32Array((1 << 9) * 12); // 9 bit key * 12 possible arrangements
Cube.prototype.applyBasicMove = function(move) {}; // placeholder
(function() {
  // sends an array[9] keypad to an octal number:
  // [A, B, C,
  //  D, E, F, => 0oEDGHIFCBA
  //  G, H, I,
  // ]
  var keypadToOctal = function(keypad, makeString=false) {
    var order = [4, 3, 6, 7, 8, 5, 2, 1, 0];
    var result = makeString ? "" : 0;
    for (var i = 0; i < order.length; ++i) {
      if (makeString) {
        result = result + (keypad[order[i]] & 0o7);
      } else {
        result = (result << 3) | (keypad[order[i]] & 0o7);
      }
    }
    return makeString ? "0o" + result : result;
  }
  
  // encodes each arrangement as index maps that send [A, B, C] to keypad
  // 0 = unused. 1, 2, 3 are indices of [A, B, C]
  var arrangements = {
    "u": [
      1, 2, 3,
      0, 0, 0,
      0, 0, 0
    ],
    "r": [
      0, 0, 1,
      0, 0, 2,
      0, 0, 3
    ],
    "d": [
      0, 0, 0,
      0, 0, 0,
      3, 2, 1
    ],
    "l": [
      3, 0, 0,
      2, 0, 0,
      1, 0, 0
    ],
    "e": [
      0, 0, 0,
      1, 2, 3,
      0, 0, 0
    ],
    "m": [
      0, 1, 0,
      0, 2, 0,
      0, 3, 0,
    ]
  };
  
  // arranges a triplet according to the given arrangement and reversal flags
  var arrange = function(triplet, arrangement, isReverse) {
    var t = (isReverse) ? triplet.slice().reverse() : triplet.slice();
    var a = arrangements[arrangement];
    
    return a.map(e => e ? t[e-1] : 0);
  }
  
  // using keypadToOctal(), arrangements{}, and arrange(), populate Cube.arrange[]
  for (var state = 0; state < (1 << 9); ++state) {
    var triplet = [state & 0o7, (state >> 3) & 0o7, state >> 6];
    for (var arr in arrangements) {
      var a = Object.keys(arrangements).indexOf(arr);
      Cube.arrange[state | (a << 9)] = keypadToOctal(arrange(triplet, arr, false));
      Cube.arrange[state | ((a+6) << 9)] = keypadToOctal(arrange(triplet, arr, true));
    }
  }
  
  // helper functions that add nuts/bolts of JS syntax
  var buildSwitch = function(cases) { // cases = [{ val: value, src: [string] }]
    var sortedCases = cases.sort((x, y) => x.val - y.val);
    var s = "Cube.applyCases = [\n";
    for (var i = 0; i < cases.length; ++i) {
      s += "  function(ptr) { // " + Cube.basicMoves[i] + "\n" + cases[i].src.map(e => "    " + e.replace(/this/g, "ptr") + "\n").join("") + "  }";
      s += (i != cases.length-1) ? ",\n" : "\n";
    }
    s += "];\n";
    return s;
  }
  var wrapBody = function(cases) {
    return buildSwitch(cases) + "Cube.prototype.applyBasicMove = function(move) {\n" + "  return Cube.applyCases[move](this);" + "\n};";
  }
  
  // helper functions that compile DSL to JS
  var compileFace = face => (face != "tmp") ? "this.state[" + ["U", "L", "F", "R", "B", "D"].indexOf(face) + "]" : face;
  var compileArr = arr => ["u", "r", "d", "l", "e", "m"].indexOf(arr);
  var arrToKey = function(face, arr) {
    var f = compileFace(face[0]);
    switch (compileArr(arr)) {
      case 0: return "(" + f + "& 0o777)";
      case 1: return "((" + f + " >> 6) & 0o777)";
      case 2: return "((" + f + " >> 12) & 0o777)";
      case 3: return "(((" + f + " >> 18) & 0o77) | ((" + f + " & 0o7) << 6))";
      case 4: return "((" + f + " >> 21) | ((" + f + " >> 3) & 0o700))";
      case 5: return "(((" + f + " >> 3) & 0o7) | ((" + f + " >> 21) & 0o70) | ((" + f + " >> 9) & 0o700))";
    }
  };
  var maskedArr = function(face, arr, isComplement=false) {
    var f = compileFace(face[0]);
    var a = 7 * !isComplement, b = 7 * isComplement;
    switch (compileArr(arr)) {
      case 0: return "(" + f + " & " + keypadToOctal([a, a, a, b, b, b, b, b, b], true) + ")";
      case 1: return "(" + f + " & " + keypadToOctal([b, b, a, b, b, a, b, b, a], true) + ")";
      case 2: return "(" + f + " & " + keypadToOctal([b, b, b, b, b, b, a, a, a], true) + ")";
      case 3: return "(" + f + " & " + keypadToOctal([a, b, b, a, b, b, a, b, b], true) + ")";
      case 4: return "(" + f + " & " + keypadToOctal([b, b, b, a, a, a, b, b, b], true) + ")";
      case 5: return "(" + f + " & " + keypadToOctal([b, a, b, b, a, b, b, a, b], true) + ")";
    }
  };
  var arrToArr = function(face, arr1, arr2, relation) {
    return "Cube.arrange[" + arrToKey(face, arr1) + " | 0b" +
      (((relation == "~>") ? compileArr(arr2) + 6 : compileArr(arr2)) << 9).toString(2) + "]";
  };
  var rotateFace = function(face, eighths) { // rotates clockwise
    var f = compileFace(face[0]);
    var dummy = ["0", "0", "0", "0", "0", "0", "0", "0"];
    var rot1 = f + " & 0o0" + dummy.map((e, i) => (i < eighths) ? "0" : "7").join("");
    var rot2 = f + " & 0o0" + dummy.map((e, i) => (i < eighths) ? "7" : "0").join("");
    var center = f + " & 0o7" + dummy.join("");
    return f + " = ((" + rot2 + ") >> " + (3 * (8 - eighths)) +
      ") | ((" + rot1 + ") << " + (3 * eighths) + ") | (" + center + ");";
  }
  var compileMove = function(name, type, faces, arrs, relations) {
    var src = [];
    if (type == "face") {
      switch (name.substring(1)) {
        case "":  src = src.concat(["// rotate " + name[0] + " stickers cw",  rotateFace(name, 2)]); break;
        case "2": src = src.concat(["// rotate " + name[0] + " stickers 180", rotateFace(name, 4)]); break;
        case "'": src = src.concat(["// rotate " + name[0] + " stickers ccw", rotateFace(name, 6)]); break;
      }
    }
    
    isEasy = [];
    //console.log(name, type, faces, arrs, relations);
    for (var i = 0; i < arrs.length; ++i) {
      isEasy.push((relations[i] == "->") && (arrs[i] == arrs[(i + 1) % arrs.length]));
    }
    
    var faces = faces.slice();
    var arrs = arrs.slice();
    var relations = relations.slice();
    if (name.substring(1) == "'") {
      faces.reverse();
      arrs.reverse();
      relations = [relations[relations.length-1]].concat(relations.slice(0, relations.length-1)).reverse();
      isEasy = [isEasy[isEasy.length-1]].concat(isEasy.slice(0, isEasy.length-1)).reverse();
    }
    
    var delta = 1;
    var moved = i => (isEasy[i] ? maskedArr(faces[i], arrs[i]) : arrToArr(faces[i], arrs[i], arrs[(i + delta) % 4], relations[i]));
    var preserved = i => compileFace(faces[i]) + " = " + maskedArr(faces[i], arrs[i], true);
    
    if (name.substring(1) != "2") { // not double move
      src.push("// cycle " + faces.join() + " faces");
      src.push("var tmp = " + moved(0));
      var cycles = [preserved(1) + " | tmp;"];
      for (var i = 1; i < arrs.length; ++i) {
        var j = (i + 1) % 4;
        cycles.unshift(preserved(j) + " | " + moved(i));
      }
      src = src.concat(cycles);
    } else {
      var duplicateRelations = relations.slice();
      delta = 2;
      for (var i = 0; i <= 1; ++i) {
        var indices = [i, i+2];
        for (var j = 0; j < indices.length; ++j) {
          relations[indices[j]] = (relations[indices[j]] != relations[(indices[j] + 1) % 4]) ? "~>" : "->";
        }
        //console.log(name, type, faces, arrs, relations);
        isEasy = [false, false, false, false]; // lol
        src.push("// swap " + indices.map(e => faces[e]).join() + " faces");
        src.push("var tmp = " + moved(indices[0]));
        src.push(preserved(indices[0]) + " | " + moved(indices[1]));
        src.push(preserved(indices[1]) + " | tmp");
        
        relations = duplicateRelations.slice();
      }
    }
    
    return {
      val: Cube.basicMoves.indexOf(name),
      src: src
    };
  }
  var compileLine = function(line) {
    var [declaration, breakdown] = line.split(": ");
    var [name, type] = declaration.split(" ");
    
    // f, g, h, i are the faces; a, b, c, d are the arrangements; r, s, t, u are the relations
    var [f, r, g, s, h, t, i, u] = breakdown.split(" ");
    var [f, a, g, b, h, c, i, d] = (f + g + h + i).split("");
    var [faces, arrangements, relations] = [[f, g, h, i], [a, b, c, d], [r, s, t, u]];
    
    return [
      compileMove(name, type, faces, arrangements, relations),
      compileMove(name + "'", type, faces, arrangements, relations),
      compileMove(name + "2", type, faces, arrangements, relations)
    ];
  }
  var compile = function(dsl) {
    // compile each line (which may emit multiple cases) and flatten the resulting array
    var cases = dsl.split("\n").filter(l => l.trim()).map(l => compileLine(l.trim())).reduce((x, y) => x.concat(y));
    return wrapBody(cases);
  }
  
  // initialize Cube.prototype.applyBasicMove()
  eval(compile(`
    U face: Fu -> Lu -> Bu -> Ru ->
    L face: Ul -> Fl -> Dl -> Br ->
    F face: Ud -> Rl -> Du -> Lr ->
    R face: Ur -> Bl -> Dr -> Fr ->
    B face: Uu -> Ll -> Dd -> Rr ->
    D face: Fd -> Rd -> Bd -> Ld ->
    M slice: Um -> Fm -> Dm ~> Bm ~>
    E slice: Fe -> Re -> Be -> Le ->
    S slice: Ue -> Rm ~> De -> Lm ~>
  `));
})();

console.log(Cube.prototype.applyBasicMove.toString())

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

//for (var i =0; i < 511; ++i)
//  console.log(i.toString(2), Cube.pruneLookup[i]);

// helper fn for search. A* at a fixed depth
Cube.prototype.bruteForce = function(goal, goalMask, maxDepth, depth, accu, nodes) {
  // if reached max depth, check if valid solution
  if (depth == maxDepth) {
    return ((this.state[0] & goalMask) == goal) ? accu : false;
  }

  // compute heuristic and prune if possible
  var hash = 0;
  var diff = goal ^ (this.state[0] & goalMask);
  var i = 0;
  while (diff) {
    hash |= ((diff & 7) != 0) << i++;
    diff >>= 3;
  }
  //console.log((this.state[0] & goalMask).toString(8));
  //console.log(goal.toString(8));
  //console.log((goal ^ (this.state[0] & goalMask)).toString(8));
  //console.log(hash.toString(2));
  //console.log(Cube.pruneLookup[hash]);
  //console.log()
  if (depth + Cube.pruneLookup[hash] > maxDepth) {
    return false;
  }

  // recursively search at higher depth
  outerLoop:
  for (var i = 0; i < Cube.basicMoves.length; ++i) {
    // skip trivial transpositions e.g. R M L and L M R, M L R, R L M, ...
    // can just treat i like the move, since basicMoves gives order
    for (var j = accu[0] + 1;
      (--j > 0) && (Cube.axes[i] == Cube.axes[accu[j]]);) {
      if ((Cube.types[i] == Cube.types[accu[j]]) || (accu[j] >= i))
        continue outerLoop;
    }
    
    accu[++accu[0]] = i; this.applyBasicMove(i);
    if (this.bruteForce(goal, goalMask, maxDepth, depth + 1, accu, nodes))
      return accu;
    this.applyBasicMove(Cube.invert[i]); --accu[0];

    if (DEBUG) {
      nodes[0]++;
    }
  }

  return false;
};

// main search algorithm. IDA* with no max depth
Cube.prototype.iterativeDeepening = function(goal, nodes) {
  nodes = nodes || [0];

  var mapping = [0, 1, 2, 7, 8, 3, 6, 5, 4];// TODO: fix this and comparison w/ goal state and prunign
  var goalInt = (goal == "") ? 0 : goal.split("").map((e, i) => ((e | 0) + 1) << (3 * mapping[i])).reduce((x, y) => x | y)|0;
  var goalMask = (goal == "") ? 0 : goal.split("").map((e, i) => 7 << (3 * mapping[i])).reduce((x, y) => x | y)|0;
  console.log(goal, goalInt.toString(8));
  console.log(goalMask.toString(8));
  var accu = new Uint8Array(MAX_SEARCH_DEPTH); // [length, item1, item2, ..]

  for (var i = 0; true; i++) {
    if (DEBUG) {
      console.log("Searching depth " + i);
    }

    var searchResult = this.bruteForce(goalInt, goalMask, i, 0, accu, nodes);

    if (searchResult) {
      var s = [];
      for (var i = 1; i < accu[0] + 1; i++) {
        s.push(Cube.basicMoves[accu[i]]);
      }
      return s;
    }
  }
  
  return false;
};

module.exports = Cube;
//var c = new Cube();
//c.apply("R U B L D F M E S f r");
//c.state.map(e => e.toString(8));

//var moves = 1e7;
//var c = new Cube();
//var start = Date.now();
//for (var i = 0; i < moves; ++i) {
//  c.applyBasicMove(Math.floor(Cube.basicMoves.length * Math.random()))
//}
//var duration = Date.now() - start;
//console.log("Time elapsed: " + duration + " ms => " + (moves / duration * 1000) + " moves/s");
