var path = require("path"),
    fs = require("fs"),
    mkdirp = require("mkdirp"),
    persist = require("./../persist");

function StoragePrototype() {

    var db = null;
    var collectionName = "stores";

    this.ensureLocalPath = function(path) {
        mkdirp.sync(path);
        return path;
    };

    this.addMetaInfoEvent= function(storeName, storeEventInfo, callback) {
        var self = this;
        this.getMetaInfo(storeName, function(err,obj) {
            obj.events = [storeEventInfo].concat(obj.events || []);
            self.save(obj, callback);
        });
    };

    this.getMetaInfo = function(name, callback) {
        this.load({name: name}, function(err, obj){
            callback(err, obj || {name:name});
        });
    };

}
StoragePrototype.prototype = new persist.CollectionAccessPrototype("stores");

module.exports = new StoragePrototype();