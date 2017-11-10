const cluster = require('cluster');

let InterprocessMessage = require('./InterprocessMessage');
let OrquestadorNodeManager = require('./OrquestadorNodeManager');

let OrquestadorWorker = {
	
	init: function(app, port, nodes) {
		
		OrquestadorWorker.initServer(app, port);
		OrquestadorWorker.initNodes(nodes);
		
	},
	
	initServer: function(app, port) {
		
		app.get('/:key', function(request, response) {
			OrquestadorWorker.get(response, request.params.key);
		});
	
		app.post('/', function(request, response) {
			if(!request.body.key || !request.body.value) {
				OrquestadorWorker.error(response, 'JSON inválido');
			} else {
				OrquestadorWorker.save(response, request.body.key, request.body.value);
			}
		});
		
		app.listen(port);
		
	},
	
	initNodes: function(nodes) {

		nodes.forEach(function(url) {
			OrquestadorNodeManager.attachNode(url).then(function(url) {
				console.log('Nodo '+url+' agregado a worker '+cluster.worker.id+'.');
			}, function(error) {
				console.error(error);
				process.exit();
			});
		});
		
	},

	error: function(response, msg) {
		response.status(404).send({ success: false, error: msg, worker: cluster.worker.id });
	},
	
	save: function(response, key, value) {
		
		OrquestadorNodeManager.save(key, value).then(function(data) {
			data.worker = cluster.worker.id;
			response.send(data);
		}, function(err) {
			OrquestadorWorker.error(response, err);
		});		
		
	},
	
	get: function(response, key) {
		
		OrquestadorNodeManager.get(key).then(function(data) {
			data.worker = cluster.worker.id;
			response.send(data);
		}, function(err) {
			OrquestadorWorker.error(response, err);			
		});
		
	},
	
	handleProcessMessage: function(obj) {
		
		//Recibir ubicación de nuevas claves del processo maestro
		if(obj.cmd === InterprocessMessage.NEW_KEY) {
			OrquestadorNodeManager.register(obj.key, obj.node);
		}
		
	},
	
	
};

module.exports = OrquestadorWorker;