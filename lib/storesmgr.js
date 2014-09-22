
var config = require("./config");

var LocalStorage = require("./storage/localstorage");

function StoreManager() {

    var stores = {};

    this.getStore = function(name) {
        var storeConfig = config.get("stores." + name, {});
        if (!storeConfig.type || storeConfig.type.trim() == "local") {
            return new LocalStorage(name, storeConfig);
        };
    };

};

module.exports = new StoreManager();