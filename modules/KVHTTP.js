var Promise = require('promise');
let http = require('http');

var KVHTTP = {
	
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
						reject(e.message);
					}
				});
	
			}).on('error', function(e) {
				reject(e.message);
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
						reject(e.message);
					}
				});

			}).on('error', function(e) {
				reject(e.message);
			});
			
			request.end(body);
							
		});
			
	}
	
}

module.exports = KVHTTP;