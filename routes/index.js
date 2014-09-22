var express = require('express');
var router = express.Router();
var path = require("path");

var ROOT = path.resolve(path.join(__dirname, "../public"));

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Fast' });
});

/* GET home page. */
router.get('/login', function(req, res) {
    // res.render('login.html', { title: 'Fast' });
    res.sendFile("login.html", {root:ROOT});
});

module.exports = router;
