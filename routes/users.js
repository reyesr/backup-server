var express = require('express');
var router = express.Router();
var users = require("../lib/users");

var COOKIE_MAX_AGE = 60*60*24*365;

/* GET users listing. */
router.post('/login', function(req, res) {
    console.log("/login body", req.body);

    var authKey = req.signedCookies["authkey"];

    if (req.body.login && req.body.password) {
        users.loadUserWithCredentials(req.body.login, req.body.password, function(err, user) {
            if (!err && user) {
                users.createAuthKey(user, function(err, key) {
                    if (!err) {
                        var cookieOptions = { signed: true, path: "/" };
                        if (req.body.rememberMe) {
                            cookieOptions.maxAge = COOKIE_MAX_AGE;
                        }
                        res.cookie("authkey", key, cookieOptions);
                        res.json({statut: "ok"});
                    } else {
                        res.json({statut: "ko", msg: "Can't create an authkey"});
                    }
                });
            } else {
                req.json({statut: "ko"});
            }
        });
    };
});

module.exports = router;
