var KVHTTP = require('../modules/KVHTTP');
var Promise = require('bluebird');

const FALLEN_NODE = {isMaster: null};

module.exports = function masterFinderWith(config) {
  var masterPromise = null; // no hay master al inicio
  var orquestadores = config.orquestadores;

  var masterFinder = {

    postToMaster: function (key, value) {
      return masterFinder.requestToMaster(function (master) {
        return KVHTTP.post(master.url, '/', {key, value});
      });
    },

    getFromMaster: function (key) {
      return masterFinder.requestToMaster(function (master) {
        return KVHTTP.get(master.url, '/' + key);
      });
    },

    deleteFromMaster: function (key) {
      return masterFinder.requestToMaster(function (master) {
        return KVHTTP.delete(master.url, '/' + key);
      });
    },

    /////////////////////////////////////////////////////////////////////
    //// LOS METODOS QUE SIGUEN SON MAS BIEN UTILITARIOS             ////
    //// SOLO DEBERIAN INTERESARLES AL CLIENTE LOS METODOS DE ARRIBA ////
    /////////////////////////////////////////////////////////////////////
    getMaster: function () {
      return masterFinder.masterPromise || masterFinder.findNewMaster();
    },

    findNewMaster: function () {
      masterFinder.masterPromise = Promise.all(
        orquestadores.map(function (orquestadorURL) {
          return KVHTTP.get(orquestadorURL, '/is-master')
            .then(function (isMasterResponse) {
              return {isMaster: isMasterResponse.isMaster, url: orquestadorURL};
            })
            .catch(function (isMasterError) {
              return FALLEN_NODE;
            })
        })
      ).then(function (isMasterResponses) {
        return isMasterResponses.find(function (orquestador) {
          return orquestador.isMaster;
        });
      });

      return masterFinder.masterPromise;
    },

    requestToMaster: function requestToMaster(realRequestTo, attempts) {
      var attempts = attempts || 3;

      return masterFinder.getMaster().then(function (master) {
        return realRequestTo(master).catch(function (error) {
          if (error.includes(KVHTTP.errors.CONNECTION_ERROR)) {

            //si el error es de coneccion queremos un nuevo master
            //masterFinder va a recorrer la lista de orquestadores
            return masterFinder.findNewMaster().then(function () {

              if (attempts == 1) return Promise.reject('Couldnt get from master. Error -  ' + error);

              //reintenta 3 veces, esperando un total de 1 segundo
              return Promise
                .delay(attempts * 200)
                .then(masterFinder.requestToMaster(realRequestTo, attempts - 1));
            });
          }
        });
      });
    }
  }

  return masterFinder;
}