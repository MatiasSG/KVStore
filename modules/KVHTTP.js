var Promise = require('promise');
let http = require('http');
let request = require('request-promise-native');

const errors =  {
	CONNECTION_ERROR: "CONNECTION_ERROR: ",
	PARSING_ERROR: "PARSING_ERROR: "
};

var KVHTTP = {
	errors,

	get: function(url, path) {

		return new Promise(function(resolve, reject) {

			host = url.split(':');
			if(host.length !== 2) {
				reject(url+' no es un servidor válido.');
			}

			http.get({
				hostname: host[0],
				port: host[1],
				path: path
			}, function(res) {

				let rawData = '';
				res.setEncoding('utf8');
				res.on('data', function(chunk) { rawData += chunk; });
				res.on('end', function() {
					try {
						let parsedData = JSON.parse(rawData);
						resolve(parsedData);
					} catch(e) {
						reject(errors.PARSING_ERROR + e.message);
					}
				});

			}).on('error', function(e) {
				reject(errors.CONNECTION_ERROR + e.message);
			});

		});

	},

	post: function(url, path, body) {

		return new Promise(function(resolve, reject) {

			host = url.split(':');
			if(host.length !== 2) {
				reject(url+' no es un servidor válido.');
			}

			body = JSON.stringify(body);

          console.log({
            hostname: host[0],
            port: host[1],
            path: path,
            method: 'POST',
            headers: {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(body)
            }
          })
			let request = new http.ClientRequest({
				hostname: host[0],
				port: host[1],
				path: path,
				method: 'POST',
				headers: {
			        "Content-Type": "application/json",
			        "Content-Length": Buffer.byteLength(body)
				}
			});

			request.on('response', function(res) {

				let rawData = '';
				res.setEncoding('utf8');
				res.on('data', function(chunk) { rawData += chunk; });
				res.on('end', function() {
					try {
						let parsedData = JSON.parse(rawData);
						resolve(parsedData);
					} catch(e) {
						reject(errors.PARSING_ERROR + e.message);
					}
				});

			}).on('error', function(e) {
				reject(errors.CONNECTION_ERROR + e.message);
			});

			request.end(body);

		});

	},

	delete: function(url, path) {
		var urlWithProtocol = url.includes("http")? url : "http://" + url

		return request.delete(urlWithProtocol + path).on('error', function (e) {
			reject(errors.CONNECTION_ERROR + e.message);
		});
	}

}

module.exports = KVHTTP;