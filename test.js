const CubestateCompiler = require("./cubestate.js");
const fs = require("fs");

var compiler = new CubestateCompiler();

console.log(compiler.compile(fs.readFileSync("helloworld.cs").toString()));
console.log(compiler.compile(fs.readFileSync("cat.cs").toString()));

const Cube = require("./cube.js");

var cube = new Cube();

cube.apply("R U R' U' R' F R2 U' R' U' R U R' F'");
console.log(cube.state.join("").match(/.{9}/).join("\n"));
