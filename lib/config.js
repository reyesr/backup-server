var config = require("config-file-loader"),
    pathget = require("object-path-get");

var defaultConfig = {
    port: 3000,
    admin: {
        login: "root",
        password: "test123"
    }
};

function Config(filename) {
    var configuration = new config.Loader().setDefault(defaultConfig).setSaveDefaultIfNotFound(true).get(filename);

    this.get = function(path, defaultValue) {
        return pathget(configuration, path, defaultValue);
    }

}

module.exports = new Config("backupserver");