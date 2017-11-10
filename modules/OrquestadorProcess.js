const cluster = require('cluster');
let InterprocessMessage = require('./InterprocessMessage');

let OrquestadorProcess = {
	
	handleWorkerMessage: function(obj) {
		if(obj.cmd === InterprocessMessage.BROADCAST) {
			OrquestadorProcess.broadcast(obj.key, obj.node);
		}
	},
	
	broadcast: function(key, node) {
		//Enviar nueva clave a workers
		for (const id in cluster.workers) {
			cluster.workers[id].send({ cmd: InterprocessMessage.NEW_KEY, key: key, node: node });
		}
		
		return key;
	},
	
};

module.exports = OrquestadorProcess;