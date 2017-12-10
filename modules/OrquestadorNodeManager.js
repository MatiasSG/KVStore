const cluster = require('cluster');
let KVHTTP = require('./KVHTTP');
let InterprocessMessage = require('./InterprocessMessage');
let debug = require('debug')('KVStore:OrquestadorNodeManager');

const PEER_DOWN = 0;

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
			let dataNodeToSave = OrquestadorNodeManager.findKey(key) || OrquestadorNodeManager.nextNode();

			debug('Enviando clave %s al nodo %s', key, dataNodeToSave);

			KVHTTP.post(dataNodeToSave, '/', { key: key, value: value }).then(function(data) {

				debug('Clave %s almacenada en %s', key, dataNodeToSave);

				//Notificar proceso maestro
				process.send({ cmd: InterprocessMessage.BROADCAST, key: key, node: dataNodeToSave });

				resolve(data);
			}, function(err) {
				debug('Error al almacenar clave %s en %s', key, dataNodeToSave);
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
	},

	isItMaster: function (orquestadores) {
		debug("Buscando entre %s", orquestadores)

		return Promise.all(
			//obtiene todos los id de los pares
			orquestadores.map(function (orquestadorURL) {
				return KVHTTP.get(orquestadorURL, '/id')
					.then(function (response) {
						return response.id;
					})
					.catch(function (error) {
                        debug("El nodo %s no pudo ser conultado, se asume caido", orquestadorURL)
                        return PEER_DOWN;
                    });
			})
		).then(function (peerIds) {
			debug("Comparando Ids con pares %s", peerIds);
			debug("El Id del nodo es %s", OrquestadorNodeManager.id);

			//si ninguno es mayor este nodo es master
			return !Boolean(
				peerIds.find(function (id) {
					return id > OrquestadorNodeManager.id
				})
			);
		});
	}
}

module.exports = OrquestadorNodeManager;