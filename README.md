# [cubestate](https://www.esolangs.org/wiki/Cubestate)
A language which uses Rubik's Cubes as memory. Steals [this BF interpreter](https://github.com/susam/bfi).

## Usage
Simply `require("./cubestate.js")` to get the `cubestate` object.

* `cubestate.chunkBF`: Compacts and chunks BF code into 9 byte chunks, unless a `.` or `,` is found, consistent with how cubestate interprets faces.
* `cubestate.compile`: Compiles cubestate code into BF.
* `cubestate.generateCS`: Generates cubestate code from inputted BF.

Note: The use of `cubestate.chunkBF` and `cubestate.generateCS` for competitions is definitely cheating and you definitely shouldn't cheat.

## Examples

* `99bottles.cs`: A port of [this](http://www.99-bottles-of-beer.net/language-brainfuck-2542.html) 99 bottles of beer program in BF. The original BF program has a mistake where it says "pass it fround" instead of "pass it around", and so does `99bottles.cs`.
* `cat.cs`: A port of `,[.,]`.
* `helloworld.cs`: Exactly what it sounds like!
* `logic.cs`: A port of [this](http://www.hevanet.com/cristofd/brainfuck/logical.txt) binary logic expression calculator in BF. Takes in RPN.
* `newline.cs`: Prints a newline.
* `rot13.cs`: A port of the ROT13 program example on the Wikipedia page for BF.
* `truthmachine.cs`: A port of `,[.>+<-[-[>]<++<-]>]`, a truth machine in BF.
