let NodoWorker = {
	
	data: {},
	
	init: function(app, port) {
		
		NodoWorker.initServer(app, port);
	
	},
	
	initServer: function(app, port) {
		
		app.get('/status', function(request, response) {
			response.send({ success: true });
		});
	
		app.get('/:key', function(request, response) {
			NodoWorker.get(response, request.params.key);
		});
	
		app.post('/', function(request, response) {
			if(!request.body.key || !request.body.value) {
				NodoWorker.error(response, 'JSON inválido');
			} else {
				NodoWorker.save(response, request.body.key, request.body.value);
			}
		});

		app.listen(port);
		
	},
	
	error: function(response, msg) {
		response.status(404).send({ success: false, error: msg });
	},
	
	save: function(response, key, value) {
		
		console.log('save: '+key+': '+value);
		
		NodoWorker.data[key] = value;
		response.send({ success: true, key: key, value: value });
		
	},
	
	get: function(response, key) {
		
		if(typeof NodoWorker.data[key] !== 'undefined') {
			let value = NodoWorker.data[key];
			
			console.log('get: '+key+': '+value);			
			response.send({ success: true, key: key, value: value });
		} else {
			NodoWorker.error(response, 'Clave inexistente');
		}
		
	}
	
};

module.exports = NodoWorker;