const Cube = require("./cube.js");

var cube = new Cube();

cube.apply("R U R' U' R' F R2 U' R' U' R U R' F'");

cube.printState();
