var masterFinderWith = require('./MasterFinder');

module.exports = function driverWith(config) {
  
  var masterFinder = masterFinderWith(config)

  return {
    get: function (key) {
      return masterFinder.getFromMaster(key);
    },

    insert: function (key, value) {
      return masterFinder.postToMaster(key, value);
    },

    allBelow: function (key) {
      return masterFinder.getFromMaster('max/' + key);
    },

    allAbove: function (key) {
      return masterFinder.getFromMaster('min/' + key);
    }
  }
}