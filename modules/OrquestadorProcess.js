const cluster = require('cluster');
let debug = require('debug')('KVStore:OrquestadorProcess');
let InterprocessMessage = require('./InterprocessMessage');

let OrquestadorProcess = {
	
	handleWorkerMessage: function(obj) {
		if(obj.cmd === InterprocessMessage.BROADCAST) {
			OrquestadorProcess.broadcast(obj.key, obj.node);
		}
	},
	
	broadcast: function(key, node) {
		debug('Enviando clave %s a todos los workers', key);
		
		for (const id in cluster.workers) {
			cluster.workers[id].send({ cmd: InterprocessMessage.NEW_KEY, key: key, node: node });
		}
		
		return key;
	},
	
};

module.exports = OrquestadorProcess;