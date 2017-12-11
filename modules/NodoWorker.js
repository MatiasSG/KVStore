let debug = require('debug')('KVStore:NodoWorker');

let NodoWorker = {

	data: {},

	init: function(app, port, config) {
        NodoWorker.config = config;
		NodoWorker.initServer(app, port);
	},

	initServer: function(app, port) {

		app.get('/status', function(request, response) {
			response.send({ success: true });
		});

		app.get('/min/:value', function(request, response) {
			NodoWorker.min(response, request.params.value);
		});

		app.get('/max/:value', function(request, response) {
			NodoWorker.max(response, request.params.value);
		});

		app.get('/:key', function(request, response) {
			NodoWorker.get(response, request.params.key);
		});

		app.delete('/:key', function(request, response) {
			NodoWorker.delete(response, request.params.key);
		});

		app.post('/', function(request, response) {
			const error = NodoWorker.checkErrors(request);

            if(error) {
              NodoWorker.error(response, error.errorStatus, error.errorMessage);
            } else {
			  NodoWorker.save(response, request.body.key, request.body.value);
            }
        });

		app.listen(port);
	},

	checkErrors: function (request) {
        const config = NodoWorker.config;
        const exceedsBytes = (str, megabytes) => Buffer.byteLength(key, 'utf8') > megabytes * Math.pow(2, 20);
      
        const key = request.body.key;
        const value = request.body.value;

		if(!key || !value)
			return {errorStatus: 404, errorMessage: 'JSON inválido'};

        if(typeof key !== 'string' || typeof value !== 'string')
            return {errorStatus: 400, errorMessage: 'La clave y el valor deben ser strings'};

        if(Object.keys(NodoWorker.data).length + 1 > config.maxPairNum)
            return {errorStatus: 400, errorMessage: 'El nodo no puede aceptar mas datos, se alcanzaron los ' + config.maxPairNum};
      
        if(exceedsBytes(key, config.maxKeySize) || exceedsBytes(value, config.maxValSize))
            return {errorStatus: 400, errorMessage: 'La clave o el valor exceden el tamaño indicado en la configuracion'};
	},

	error: function(response, status, msg) {
		response.status(status).send({ success: false, error: msg });
	},

	save: function(response, key, value) {

		debug('Almacenando clave %s', key);

		NodoWorker.data[key] = value;
		response.send({ success: true, key: key, value: value });

	},

	get: function(response, key) {

		if(typeof NodoWorker.data[key] !== 'undefined') {
			let value = NodoWorker.data[key];

			debug('Leyendo clave %s', key);
			response.send({ success: true, key: key, value: value });
		} else {
			debug('Clave %s inexistente', key);
			NodoWorker.error(response, 404, 'Clave inexistente');
		}

	},

	delete: function (response, key) {
		if(typeof NodoWorker.data[key] !== 'undefined') {
			let value = delete NodoWorker.data[key];

			debug('Borrando clave %s', key);
			response.send({ success: true, key: key, value: value });
		} else {
			debug('Clave %s inexistente', key);
			NodoWorker.error(response, 404, 'Clave inexistente');
		}
	},
	
	min: function(response, min) {
		
		NodoWorker.getFiltered(response, function(v) {
			return (v >= min);
		})
		
	},

	max: function(response, min) {
		
		NodoWorker.getFiltered(response, function(v) {
			return (v <= min);
		})
		
	},

	getFiltered: function(response, filter) {
	
		debug('Filtrando claves');
		
		var output = {};
		for(var i in NodoWorker.data)
			if(filter(NodoWorker.data[i]))
				output[i] = NodoWorker.data[i];

		response.send({ success: true, keys: output });

	}

};

module.exports = NodoWorker;