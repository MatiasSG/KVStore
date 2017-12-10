//Procesamiento paralelo
const cluster = require('cluster');
const http = require('http');
const cpus = require('os').cpus().length;
const InterprocessMessage = require('./modules/InterprocessMessage');

//API REST
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
let resolve = require('path').resolve;
app.use(bodyParser.json());

//Orquestador
let OrquestadorProcess = require('./modules/OrquestadorProcess');
let OrquestadorWorker = require('./modules/OrquestadorWorker');

var orquestadorInputs = getAndValidateInput();

if (cluster.isMaster) {
	var thisOrquestadorId = parseInt(Math.random() * 10000000);

	// Fork workers.
	for (let i = 0; i < cpus; i++) {
		let worker = cluster.fork();
		worker.on('message', OrquestadorProcess.handleWorkerMessage);
		worker.send({ thisNodeId: thisOrquestadorId, cmd: InterprocessMessage.SET_ID});
	}
} else {
	OrquestadorWorker.init(app, orquestadorInputs.config, orquestadorInputs.port, orquestadorInputs.dataNodes);
	process.on('message', OrquestadorWorker.handleProcessMessage);
}


//helper que parsea y valida las entradas al orquestador
//no hay nada que ver aca...siguan viendo el resto del TP
function getAndValidateInput() {
	//queremos una copia...
	//despues usaremos pop() y afectaria tambien process.arv
	var args = process.argv.map(id => id);

	var config = require('./config/orquestador.json');

	var confOptIdx = args.indexOf("-c");
	var userConfig = args[confOptIdx + 1];

	//solo queremos logear desde el master, sino vemos repetido el mensaje por worker
	var logOnlyToMaster = ((message, logType) => { if(cluster.isMaster) console[logType || 'log'](message) });

	//se paso -c y existe el siguiente argumento
	if(confOptIdx >= 0 && userConfig) {
		try {
			logOnlyToMaster("Leyendo " + userConfig);

			config = require(resolve(userConfig));

			//la configuracion debe tener
			//el atributo orquestadores
			if(!config.orquestadores) {
				logOnlyToMaster("El archivo de configuracion no tiene un listado de orquestadores", 'error');
				process.exit();
			}

			logOnlyToMaster("Orquestadores en configuracion: " + config.orquestadores);

			args.pop(confOptIdx);
			args.pop(confOptIdx + 1);
		} catch (e) {
			logOnlyToMaster("no se pudo leer la configuración " + userConfig, 'error');
			process.exit()
		}
	} else {
		logOnlyToMaster("Usando configuracion por defecto en config/orquestador.json")
	}

	if(args.length < 4) {
		logOnlyToMaster('Faltan parámetros: node Orquestador.js -c <config_path> <puerto> <nodo1> {<nodoN>}', 'error');
		logOnlyToMaster('La opcion -c es opcional. De no ser pasado se usara config/orquestador.json', 'error');
		process.exit();
	}

	return {
		config,
		port: args[2],
		dataNodes: args.slice(3)
	}
}