//Procesamiento paralelo
const cluster = require('cluster');
const http = require('http');
const cpus = require('os').cpus().length;

//API REST
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
app.use(bodyParser.json());

//Orquestador
let OrquestadorProcess = require('./modules/OrquestadorProcess');
let OrquestadorWorker = require('./modules/OrquestadorWorker');

if(process.argv.length < 4) {
	console.error('Faltan parámetros: node Orquestador.js <puerto> <nodo1> {<nodoN>}');
	process.exit();
}

if (cluster.isMaster) {

	// Fork workers.
	for (let i = 0; i < cpus; i++) {
		let worker = cluster.fork();
		worker.on('message', OrquestadorProcess.handleWorkerMessage);
	}
		
} else {
	
	OrquestadorWorker.init(app, process.argv[2], process.argv.slice(3));
	process.on('message', OrquestadorWorker.handleProcessMessage);

}
