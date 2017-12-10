//Procesamiento paralelo
const cluster = require('cluster');
const http = require('http');
const cpus = require('os').cpus().length;
const InterprocessMessage = require('./modules/InterprocessMessage');

//API REST
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
app.use(bodyParser.json());

//Orquestador
let config = require('./config/orquestador.json');
let OrquestadorProcess = require('./modules/OrquestadorProcess');
let OrquestadorWorker = require('./modules/OrquestadorWorker');

if(process.argv.length < 4) {
	console.error('Faltan parámetros: node Orquestador.js <puerto> <nodo1> {<nodoN>}');
	process.exit();
}


if (cluster.isMaster) {
	var thisOrquestadorId = parseInt(Math.random() * 1000000);

	// Fork workers.
	for (let i = 0; i < cpus; i++) {
		let worker = cluster.fork();
		worker.on('message', OrquestadorProcess.handleWorkerMessage);
		worker.send({ thisNodeId: thisOrquestadorId, cmd: InterprocessMessage.SET_ID});
	}

} else {

	OrquestadorWorker.init(app, config, process.argv[2], process.argv.slice(3));
	process.on('message', OrquestadorWorker.handleProcessMessage);

}

