# [https://www.esolangs.org/wiki/Cubestate](cubestate)
A language which uses Rubik's Cubes as memory.

## Usage
Simply `require("./cubestate.js")` to get the `cubestate` object.

* `cubestate.chunkBF`: Compacts and chunks BF code into 9 byte chunks, unless a `.` or `,` is found, consistent with how cubestate interprets faces.
* `cubestate.compile`: Compiles cubestate code into BF.
* `cubestate.generateCS`: Generates cubestate code from inputted BF.

Note: The use of `cubestate.chunkBF` and `cubestate.generateCS` for competitions is definitely cheating and you definitely shouldn't cheat.
