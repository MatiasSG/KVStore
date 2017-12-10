var resolve = require("path").resolve
var config = require(resolve("../config/orquestador"));
var driver = require("./Driver")(config);
var fs = require( "fs" );
var fd = fs.openSync( "/dev/stdin", "rs" );

console.log("Usando los siguientes nodos orquestadores", orquestadores);

var fixtureInsertions = [
  driver.insert("someKey", "someValue")
].concat(
  [
    {key: "A", value: "primero"},
    {key: "B", value: "segundo"},
    {key: "C", value: "medio"},
    {key: "D", value: "anteultimo"},
    {key: "E", value: "ultimo"}
  ].map(function (pair) {
    driver.insert(pair.key, pair.value);
  })
)

driver.get("someKey")
driver.rangeAbove("C");
driver.rangeBelow("C");

console.log("Frenado! ahora se puede matar al master y ver el failover");
console.log("Apretar enter cuando se haya matado el master");
fs.readSync( fd, new Buffer( 1 ), 0, 1 );
fs.closeSync( fd );

//kill some master and try again
driver.get("someKey")
driver.rangeAbove("C");
driver.rangeBelow("C");