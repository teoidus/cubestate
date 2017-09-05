const CubestateCompiler = require("./cubestate.js");
const fs = require("fs");

var compiler = new CubestateCompiler();

compiler.compile(fs.readFileSync("helloworld.cs").toString());
