const cluster = require('cluster');
let debug = require('debug')('KVStore:OrquestadorWorker');
let KVHTTP = require('./KVHTTP');
let InterprocessMessage = require('./InterprocessMessage');
let OrquestadorNodeManager = require('./OrquestadorNodeManager');

let OrquestadorWorker = {
	
	init: function(app, config, port, nodes) {
		OrquestadorWorker.setConfig(config, port);
		OrquestadorWorker.initServer(app, port);
		OrquestadorWorker.initNodes(nodes);
	},

	initServer: function(app, port) {
		app.get('/id', function (request, response) {
			response.send({id: OrquestadorNodeManager.id});
		});

		app.get('/is-master', function (request, response) {
			OrquestadorWorker.isItMaster(response);
		});

		app.get('/:key', function(request, response) {
			OrquestadorWorker.get(response, request.params.key);
		});

		app.get('/min/:value', function(request, response) {
			OrquestadorWorker.collect(response, '/min/'+request.params.value);
		});

		app.get('/max/:value', function(request, response) {
			OrquestadorWorker.collect(response, '/max/'+request.params.value);
		});

		app.delete('/:key', function (request, response) {
			OrquestadorWorker.delete(response, request.params.key, request.headers['x-sent-by-id']);
		});

		app.post('/', function(request, response) {
			if(!request.body.key || !request.body.value) {
				OrquestadorWorker.error(response, 'JSON inválido');
			} else {
				OrquestadorWorker.save(response
					, request.body.key
					, request.body.value
					, request.headers['x-sent-by-id']);
			}
		});

		app.listen(port);
	},
	
	initNodes: function(nodes) {
		nodes.forEach(function(url) {
			OrquestadorNodeManager.attachNode(url).then(function(url) {
				debug('Nodo %s agregado a worker %s', url, cluster.worker.id);
			}, function(error) {
				console.error(error);
				process.exit();
			});
		});
	},

	setConfig: function (config, port) {
		//se remueve a si mismo de la lista de nodos es una restriccion para que funcione
		//nadie va querer pegarle al nodo de una misma computadora a travez de internet
		//por lo tanto es sano asumir que en mi archivo de configuracion...
		//...o bien no esta este nodo o bien esta como localhost:<puerto>
		config.orquestadoresWithoutSelf = config.orquestadores.filter(function (node) {
			return !(node.includes('localhost') && node.includes(port));
		});

		OrquestadorWorker.config = config;
	},

	error: function(response, msg) {
		response.status(404).send({ success: false, error: msg, worker: cluster.worker.id });
	},

	get: function(response, key) {
		OrquestadorNodeManager.get(key).then(function(data) {
			data.worker = cluster.worker.id;
			response.send(data);
		}, function(err) {
			OrquestadorWorker.error(response, err);
		});
	},

	save: function(response, key, value, isSentByPeer) {
		OrquestadorNodeManager.save(key, value).then(function(data) {
			data.worker = cluster.worker.id;
			response.send(data);

			// console.log(OrquestadorNodeManager.id+" ~ "+isSentByPeer)
			if(!isSentByPeer || (OrquestadorNodeManager.id > parseInt(isSentByPeer))) {
				OrquestadorWorker.requestToAllSlaves(function (slaveURL) {
					KVHTTP.post(slaveURL, '/', {key, value}, OrquestadorNodeManager.id).catch();
				});
			}
		}, function(err) {
			OrquestadorWorker.error(response, err);
		});
	},

	//TODO: refactor delete, es igual a save :(
	delete: function (response, key, isSentByPeer) {
		OrquestadorNodeManager.delete(key).then(function(data) {
			data.worker = cluster.worker.id;
			response.send(data);

			if(!isSentByPeer || (OrquestadorNodeManager.id > parseInt(isSentByPeer))) {
				OrquestadorWorker.requestToAllSlaves(function (slaveURL) {
					KVHTTP.delete(slaveURL, '/' + key, OrquestadorNodeManager.id).catch();
				});
			}
		}, function(err) {
			OrquestadorWorker.error(response, err);
		});
	},
	
	collect: function(response, path) {
		OrquestadorNodeManager.collect(path).then(function(data) {
			response.send(data);
		});
	},
	
	handleProcessMessage: function(obj) {
		if(obj.cmd == InterprocessMessage.SET_ID) {
			OrquestadorNodeManager.id = obj.thisNodeId;
		}
		
		//Recibir ubicación de nuevas claves del processo maestro
		if(obj.cmd === InterprocessMessage.NEW_KEY) {
			OrquestadorNodeManager.register(obj.key, obj.node);
		}
	},

	requestToAllSlaves: function (request) {
		var orquestadoresWithoutSelf = OrquestadorWorker.config.orquestadoresWithoutSelf;

		orquestadoresWithoutSelf.forEach(function (orquestadorURL) {
			request(orquestadorURL);
		});
	},
	
	isItMaster: function (response, orquestadores) {
		var orquestadoresWithoutSelf = OrquestadorWorker.config.orquestadoresWithoutSelf;

		OrquestadorNodeManager.isItMaster(orquestadoresWithoutSelf).then(function (isMaster) {
			response.send({ isMaster, id: OrquestadorNodeManager.id });
		});
	}
};

module.exports = OrquestadorWorker;