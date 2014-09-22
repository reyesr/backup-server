var express = require('express');
var router = express.Router();
var Busboy = require('busboy');
var fs = require("fs"),
    path = require("path"),
    os = require('os'),
    crypto = require("crypto");
var storemgr = require("../../lib/storesmgr")

/* GET users listing. */
router.get('/test', function(req, res) {
    res.send('respond with a store resource');
});

router.get('/:name', function(req, res) {
    var storeName = req.params.name;
    var store = storemgr.getStore(storeName);
    store.list(function(err, events) {
        if (!err) {
            res.json({
                status: "ok",
                data: events
            });
        } else {
            res.json({status: "ko"});
        }
    });
});

router.post('/:name', function(req, res, next) {
    var storeName = req.params.name;
    console.log("PUT on ", storeName);

    var store = storemgr.getStore(storeName);
    var files = [];

    var busboy = new Busboy({ headers: req.headers });
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var saveTo = path.join(os.tmpDir(), path.basename(fieldname));
        files.push((saveTo));
        file.pipe(fs.createWriteStream(saveTo));
    });

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        console.log('Field [' + fieldname + ']: value: ', val);
    });
    busboy.on('finish', function() {
        console.log('Done parsing form!');

        files.forEach(function(file) {
            store.addFile(file, {
                origin: "rest-api",
                from: req.ip,
                protocol: req.protocol
            });
        });


        res.writeHead(200, { Connection: 'close' });
        res.end();
    });
    return req.pipe(busboy);
});


module.exports = router;
