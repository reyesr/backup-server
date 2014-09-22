var config = require("./config"),
    MongoClient = require("mongodb").MongoClient,
    ObjectID = require("mongodb").ObjectID,
    async = require("async");

function Collection(name, db) {
    this.name = name;
    this.impl = db;

    this.save = function(object, callback) {
        this.impl.save(object, callback);
    };

    this.findOne = function(query, callback) {
        this.impl.findOne(query, callback);
    };

    this.ensureIndex = function(fieldName, isUnique, callback) {
        this.impl.ensureIndex(fieldName, isUnique, callback);
    };

    this.remove = function(query, callback) {
        this.impl.remove(query, callback);
    };
}


function storage(filename, callbackWhenAvailable) {

    var mongo = null,
        ready = false,
        queue = [];

    var self = this;

    function tryConnection(count) {
        MongoClient.connect("mongodb://127.0.0.1:27017/backupmanager", function(err, dbcnx) {
            if (!err) {
                mongo = dbcnx;
                ready = true;
                queue.forEach(function(qel) {
                    if (qel.type == "getcoll") {
                        self.getCollection(qel.name, qel.callback);
                    }
                });
            } else if (count < 10) {
                console.error("Can't connect, trying again in 1s...");
                setTimeout(function() {
                    tryConnection(count+1);
                }, 1000);
            } else {
                queue.forEach(function(qel) {
                    qel.callback(true);
                });
            }
        });
    }

    tryConnection(0);

    this.getCollection = function(collectionName, callback) {
        if (ready) {
            var mongocoll = mongo.collection(collectionName);
            callback(null, new Collection(collectionName, mongocoll));
        } else {
            queue.push({type:"getcoll", name: collectionName, callback: callback});
        }
    }

};

var database = new storage();

function CollectionAccessPrototype(name) {

    var coll;
    this.getCollection = function(callback) {
        if (coll) {
            callback(coll);
        } else {
            database.getCollection(name, function (err, dbcoll) {
                if (err) {
                    callback(err);
                } else {
                    coll =
                    callback(err, new Collection(name, dbcoll));
                }
            });
        }
    }

    this.save = function(object, callback) {
        this.getCollection(function(err,coll) {
            if (!err) {
                coll.save(object, callback);
            } else {
                callback(err);
            }
        });
    };

    this.load = function(query, callback) {
        this.getCollection(function(err,coll){
            if (!err) {
                coll.findOne(query, callback);
            } else {
                callback(err);
            }
        });
    };

    this.remove = function(query, callback) {
        this.getCollection(function(err,coll){
            coll.remove(query, callback);
        });
    };

    this.ensureIndex = function(fieldName, isUnique, callback) {
        this.getCollection(function(err, coll) {
            coll.ensureIndex(fieldName, isUnique, callback);
        });
    };

};

// exports.db = database;
exports.CollectionAccessPrototype = CollectionAccessPrototype;
