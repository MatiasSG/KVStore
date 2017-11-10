const cluster = require('cluster');
let KVHTTP = require('./KVHTTP');
let OrquestadorMessage = require('./OrquestadorMessage');

let OrquestadorNodeManager = {
	
	nodes: [],
	data: {},
	roundRobin: 0,
	
	attachNode: function(url) {

		return new Promise(function(resolve, reject) {
					
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
			
			KVHTTP.post(next, '/', { key: key, value: value }).then(function(data) {
				//Notificar proceso maestro
				process.send({ cmd: OrquestadorMessage.BROADCAST, key: key, node: next });
				
				resolve(data);
			}, function(err) {
				reject(err);
			})			
			
		});
		
	},
	
	register: function(key, node) {
		
		//Registrar nodo asociado a clave
		OrquestadorNodeManager.data[key] = node;
		
	},
	
	get: function(key) {
		
		return new Promise(function(resolve, reject) {
			
			//Buscar si clave ya existe
			let next = OrquestadorNodeManager.findKey(key);

			if(next === false) {
				reject('Clave inexistente.');
			} else {
			
				KVHTTP.get(next, '/'+key).then(function(data) {
					resolve(data);
				}, function(err) {
					reject(err);
				})			
				
			}

		});
		
	}
	
}

module.exports = OrquestadorNodeManager;