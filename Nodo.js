//Procesamiento paralelo
const cluster = require('cluster');
const http = require('http');
//const cpus = require('os').cpus().length;
const cpus = 1;

//API REST
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
app.use(bodyParser.json());

//Orquestador
let NodoWorker = require('./modules/NodoWorker');

if(process.argv.length !== 3) {
	console.error('Faltan parámetros: node Nodo.js <puerto>');
	process.exit();
}

if (cluster.isMaster) {

	// Fork workers.
	for (let i = 0; i < cpus; i++) {
		let worker = cluster.fork();
	}

		
} else {
	
	NodoWorker.init(app, process.argv[2]);

}
