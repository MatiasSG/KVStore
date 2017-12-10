module.exports = function masterFinderWith(config) {
  var masterPromise = null; // no hay master al inicio
  var orquestadores = config.orquestadores;

  return {
    masterPromise: this.findNewMaster(),

    getMaster: function () {
      return masterPromise;
    },

    findNewMaster: function () {
      throw new Error("Implementar esto")
    }
  }
}