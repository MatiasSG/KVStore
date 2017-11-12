const http = require('http');
const resolve = require("path").resolve;

//API REST
let express = require('express');
let app = express();
let bodyParser = require('body-parser');
app.use(bodyParser.json());

//Nodo
let NodoWorker = require('./modules/NodoWorker');
let config = require('./config'); //default

if(process.argv.length < 3) {
	console.error('Faltan parámetros: node Nodo.js <puerto> [config]');
	process.exit();
}

//vemos si el usuario paso
//un archivo de configuracion
let userConfig = process.argv[3];
if(userConfig) {
	try {
		config = require(resolve(userConfig));
	} catch(e) {
		console.error('No se puedo cargar el archivo de configuracion: ' + userConfig);
		process.exit();
	}
}

//chequeamos que la configuracion tenga lo que necesitamos
if(!config.maxKeySize || !config.maxPairNum || !config.maxValSize) {
	console.error('Los campos maxKeySize, maxPairNum, maxValSize son obligatorios en la configuracion')
}

let port = process.argv[2];
NodoWorker.init(app, port, config);
console.log('Nodo iniciado en puerto ' + port + ' usando la configuracion de ' + (userConfig || 'config.json'));