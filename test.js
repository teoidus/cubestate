const Cube = require("./cube.js");

var cube = new Cube();

cube.apply("y x U x' y' U y x U' x' y'");

cube.printState();
