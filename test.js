const cubestate = require("./cubestate.js");
const fs = require("fs");

console.log(cubestate.compile(fs.readFileSync("ex/helloworld.cs").toString()));
console.log(cubestate.compile(fs.readFileSync("ex/cat.cs").toString()));
