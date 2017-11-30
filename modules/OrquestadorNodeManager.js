const cluster = require('cluster');
let KVHTTP = require('./KVHTTP');
let InterprocessMessage = require('./InterprocessMessage');
let debug = require('debug')('KVStore:OrquestadorNodeManager');

let OrquestadorNodeManager = {
	
	nodes: [],
	data: {},
	roundRobin: 0,
	
	attachNode: function(url) {

		return new Promise(function(resolve, reject) {
			
			debug('Consultando el estado del nodo %s', url);
			
			KVHTTP.get(url, '/status').then(function(data) {
				OrquestadorNodeManager.nodes.push(url);
				resolve(url);
			}, function(error) {
				reject(error);
			});
			
		});
		
	},
	
	nextNode: function() {
		
		let index = OrquestadorNodeManager.roundRobin;	
		let total = OrquestadorNodeManager.nodes.length;
		let next = OrquestadorNodeManager.nodes[index % total];
		OrquestadorNodeManager.roundRobin++;
		return next;
		
	}, 
	
	findKey: function(key) {
	
		if(typeof OrquestadorNodeManager.data[key] !== 'undefined') {
			return OrquestadorNodeManager.data[key];
		} else {
			return false;
		}
		
	},
	
	save: function(key, value) {
		
		return new Promise(function(resolve, reject) {

			//Buscar si clave ya existe
			let next = OrquestadorNodeManager.findKey(key);

			if(next === false) {

				//Buscar próximo nodo
				next = OrquestadorNodeManager.nextNode();

			}
			
			debug('Enviando clave %s al nodo %s', key, next);
			
			KVHTTP.post(next, '/', { key: key, value: value }).then(function(data) {
				
				debug('Clave %s almacenada en %s', key, next);
				
				//Notificar proceso maestro
				process.send({ cmd: InterprocessMessage.BROADCAST, key: key, node: next });
				
				resolve(data);
			}, function(err) {
				debug('Error al almacenar clave %s en %s', key, next);
				reject(err);
			})			
			
		});
		
	},
	
	register: function(key, node) {
		
		//Registrar nodo asociado a clave
		debug('Registrar clave %s en worker %s', key, cluster.worker.id);
		OrquestadorNodeManager.data[key] = node;
		
	},
	
	get: function(key) {
		
		return new Promise(function(resolve, reject) {
			
			//Buscar si clave ya existe
			let node = OrquestadorNodeManager.findKey(key);

			if(node === false) {
				reject('Clave inexistente.');
			} else {
				
				debug('Obteniendo clave %s del nodo %s', key, node);
			
				KVHTTP.get(node, '/'+key).then(function(data) {
					debug('Clave %s obtenida de %s', key, node);
					resolve(data);
				}, function(err) {
					debug('Error al obtener clave %s de %s: %o', key, node, err);
					reject(err);
				});
				
			}

		});
		
	},
	
	collect: function(path) {
		
		return new Promise(function(resolve) {
			
			//Recolectar resultados de todos los nodos
			var answered = 0;
			var total = OrquestadorNodeManager.nodes.length;
			var output = { keys: {}, ok: [], failed: [] };
			
			OrquestadorNodeManager.nodes.forEach(function(node) {
				
				debug('Obteniendo %s del nodo %s', path, node);
			
				KVHTTP.get(node, path).then(function(data) {
					debug('%s obtenido de %s', path, node);
					
					for(var key in data.keys) {
						output.keys[key] = data.keys[key];
					}
					
					output.ok.push(node);
					answered++;
					
					if(answered == total) {
						resolve(output)
					}
				}, function(err) {
					output.failed.push(node);
					answered++;
					
					if(answered == total) {
						resolve(output);
					}
				});

			});
			
		});
		
	}
	
}

module.exports = OrquestadorNodeManager;