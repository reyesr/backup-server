var path = require("path"),
    fs = require("fs"),
    mkdirp = require("mkdirp"),
    extend = require("extend");

var SM = require('stream-multiplexer');
var crypto = require('crypto');

var digestStream = require('digest-stream');

function uniqueName(name) {
    var date = new Date();
    var ext = path.extname(name);
    var basename = path.basename(name, ext);

    var rnd = parseInt(Math.random() * 0xFFFFFF);
    var filepath = date.getFullYear().toString() + "-" + date.getMonth() + "-" + date.getDate() + "-" + date.getHours() + "-"
        + date.getMinutes() + "-" + date.getSeconds() + "-" + (date.getMilliseconds()%1000)
        + rnd.toString(16);

    return filepath;
};

function Joiner(expected, callback) {
    var count = 0;
    var object = {};
    var inError = false;
    this.callback = function(err, data) {
        if (!err) {
            extend(object, data);
        }
        inError = inError || err;
        count += 1;
        if (count == expected) {
            callback(inError, object);
        }
    };
}

function LocalStorage(name, config) {

    if (!(this instanceof LocalStorage)) {
        return new LocalStorage(storeName);
    }

    this.targetPath = config.path || "./DATA/" + name;
    this.ensureLocalPath(this.targetPath);

    this.addFile = function(from, info, callback) {
        do {
            var filename = path.resolve(path.join(this.targetPath, uniqueName(from)));
        } while(fs.existsSync(filename));
        console.log("Moving file ",filename," to ", filename);

        var wstream = fs.createWriteStream(filename);

        var self = this;
        var joiner = new Joiner(2, function(err, object) {
            console.log("joined", object)
            self.addMetaInfoEvent(name, {
                path: filename,
                md5: object.md5,
                date: new Date(),
                info: info
            }, function(err) {
                if (callback) {
                    callback();
                }
            });
        });

        var dstream = digestStream("md5", "hex", function(resultDigest, length) {
            console.log("MD5 digest:", resultDigest, length);
            joiner.callback(null, {md5: resultDigest})
        });
        fs.createReadStream(from).pipe(dstream).pipe(wstream);

        wstream.on("finish", function() {
            joiner.callback(null, {path: filename});
        });
    };

    this.list = function(callback) {
        this.getMetaInfo(name, function(err, obj) {
            callback(err, obj.events || []);
        });
    };

}

LocalStorage.prototype = require("./storageproto");

module.exports = LocalStorage;