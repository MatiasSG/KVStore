var resolve = require('path').resolve
var config = require(resolve('../config/orquestador'));
var client = require('./Client')(config);
var fs = require('fs');
var fd = fs.openSync('/dev/stdin', 'rs');
var Promise = require('promise')

console.log('Usando los siguientes nodos orquestadores', config.orquestadores);
console.log();

Promise.all([
  client.insert('someKey', 'someValue')
].concat(
  [
    {key: 'A', value: 'primero'},
    {key: 'B', value: 'segundo'},
    {key: 'C', value: 'medio'},
    {key: 'D', value: 'anteultimo'},
    {key: 'E', value: 'ultimo'}
  ].map(function (pair) {
    client.insert(pair.key, pair.value).then(console.log);
  })
).concat([
  client.get('someKey').then(console.log),
  client.allAbove('C').then(console.log),
  client.allBelow('C').then(console.log)
])).then(function () {
  console.log();
  console.log('Frenando!!! Ahora se puede matar un master!');
  console.log('Cuando se haya matado al master actual, presionar enter para seguir!');

  fs.readSync(fd, new Buffer(1), 0, 1);
  fs.closeSync(fd);

  client.get('someKey').then(console.log)
  client.allAbove('C').then(console.log);
  client.allBelow('C').then(console.log);
});


