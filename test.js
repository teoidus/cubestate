const CubestateCompiler = require("./cubestate.js");
const fs = require("fs");

var compiler = new CubestateCompiler();

console.log(compiler.compile(fs.readFileSync("cat.cs").toString()));
