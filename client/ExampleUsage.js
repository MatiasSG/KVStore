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
    {key: 'A', value: '1'},
    {key: 'B', value: '2'},
    {key: 'C', value: '3'},
    {key: 'D', value: '4'},
    {key: 'E', value: '5'}
  ].map(function (pair) {
    client.insert(pair.key, pair.value).then(console.log);
  })
)).then(function() {

  Promise.all([

	  client.get('someKey').then(console.log),
	  client.allAbove(3).then(console.log),
	  client.allBelow(3).then(console.log)

  ]).then(function() {
	
	  console.log();
	  console.log('Frenando!!! Ahora se puede matar un master!');
	  console.log('Cuando se haya matado al master actual, presionar enter para seguir!');
	
	  fs.readSync(fd, new Buffer(1), 0, 1);
	  fs.closeSync(fd);
	
	  client.get('someKey').then(console.log)
	  client.allAbove(3).then(console.log);
	  client.allBelow(3).then(console.log);
	  
  });
});


