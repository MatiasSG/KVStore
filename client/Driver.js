// Lo clientes de la base de datos son configurados con una lista de IPs de uno o más nodos orquestadores,
//   que se encargan de aceptar pedidos de escrituras y lecturas por parte de los clientes.
// No todos los clientes tienen que tener la misma lista en el mismo orden.
// En todo momento, hay un sólo orquestador activo, que se denomina master.
// Todos los clientes hablan con este nodo.
// Si un nodo master se cae, otro nodo orquestador debe tomar su lugar y volverse master
// Al establecer la primera conexión o ante un error de comunicación,
//   un cliente probará con todos los orquestadores de su lista hasta encontrar el master actual.
var Promise = require('promise');
var http = require("http");
var KVHTTP = require("../modules/KVHTTP");
var masterFinderWith = require('./MasterFinder');


module.exports = function driverWith(config) {
  
  var masterFinder = masterFinderWith(config)

  return {
    get: function (key) {
      return this.getFromMaster(key);
    },

    insert: function (key, value) {
      return new Error("FALTA MODIFICAR EL KVHTTP Y GENERALIZAR getFromMaster");
      return masterFinder.getMaster().then(function (master) {
        return KVHTTP.post(master.url, "/", { key, value });
      });
    },

    rangeBelow: function (key) {
      return this.getFromMaster("/min/" + key);
    },

    rangeAbove: function (key) {
      return this.getFromMaster("/max/" + key);
    },

    getFromMaster: function (key) {
      var self = this;

      return masterFinder.getMaster().then(function (master) {
        return KVHTTP.get(master.url, key).catch(function (error) {
          if(error.contains(KVHTTP.errors.CONNECTION_ERROR)) {
            //si el error es de coneccion queremos un nuevo master
            //masterFinder va a recorrer la lista de orquestadores
            return masterFinder.findNewMaster().then(function () {
              //cuando masterFinder tenga un nuevo master
              //masterFinder.getMaster() va a dar el nuevo
              return this.getFromMaster(key);
            });
          }
        });
      });
    }
  }
}