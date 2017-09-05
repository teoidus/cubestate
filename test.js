const cubestate = require("./cubestate.js");
const fs = require("fs");

console.log(cubestate.compile(fs.readFileSync("helloworld.cs").toString()));
console.log(cubestate.compile(fs.readFileSync("cat.cs").toString()));
