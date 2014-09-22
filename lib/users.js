var persist = require("./persist"),
    config = require("./config"),
    bcrypt = require("bcrypt-nodejs"),
    async = require("async");

function AuthCookies() {

    this.createAuth = function(userId, callback) {
        var rnd = "";
        for (var i=0; i<32; i+=1) {
            rnd += ((Math.random()*0xFFFFFFFF) << 0).toString(16);
        }
        this.save({key: rnd, userId: userId}, function(err, obj) {
            if (!err) {
                callback(err, obj.key);
            } else {
                return callback(err);
            }
        });
    };

    this.checkAuth = function(key, callback) {
        this.load({key:key}, function(err, obj) {
            if (!err && obj && obj.userId) {
                callback(null, obj.userId);
            } else {
                callback(true);
            }
        });
    };

    this.removeAllAuth = function(userId, callback) {
        this.remove({userId: userId}, callback);
    };

    this.removeAuth = function(key, callback) {
        this.remove({key:key}, callback);
    }

    this.ensureIndex("key", true, function(){});

}
AuthCookies.prototype = new persist.CollectionAccessPrototype("authCookies");

var authKeys = new AuthCookies();

function Users() {

    this.ensuresAdminExists = function(defaultAdminEntity, callback) {
        var self = this;
        this.loadAdmin(function(err, admin) {
            if (err) {
                self.save(defaultAdminEntity, callback);
            } else {
                callback(null, admin);
            }
        });
    };

    this.loadAdmin = function(callback) {
        this.load({login: "admin"}, callback);
    }


    this.loadUserWithCredentials = function(loginOrEmail, password, callback) {
        var self = this;
        this.loadUserByLoginOrEmail(loginOrEmail, function(err, entity) {
            if (!err) {
                self.comparePassword(entity, password, function(err, goodPassword) {
                    if (!err && goodPassword) {
                        callback(null, entity);
                    } else {
                        callback(err);
                    }
                });
            } else {
                callback(err);
            }
        });
    };

    this.loadUserByLoginOrEmail = function(loginOrEmail, callback) {
        var funcs = loginOrEmail.indexOf('@')>0?[this.loadUserByEmail, this.loadUserByLogin]:[this.loadUserByLogin, this.loadUserByEmail];
        var self = this;
        funcs[0].call(this, loginOrEmail, function(err, obj) {
            if (!err) {
                callback(err, obj);
            } else {
                funcs[1].call(self, loginOrEmail, callback);
            }
        });
    };

    this.loadUserByLogin = function(login, callback) {
        this.load({login: login}, callback);
    };

    this.loadUserByEmail = function(email, callback) {
        this.load({email: email}, callback);
    }

    this.setHashPassword = function(userEntity, password, callback) {
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(password, salt, null, function(err, hash) {
                userEntity.password = err?undefined:hash;
                callback(err, hash);
            });
        });
    };

    this.comparePassword = function(userEntity, password, callback) {
        bcrypt.compare(password, userEntity.password, callback);
    };

    this.createAuthKey = function(userEntity, callback) {
        if (!userEntity._id) {
            this.save(userEntity, function(err, entity) {
                if (!err) {
                    authKeys.createAuth(userEntity._id.toString(), callback);
                } else {
                    callback(true);
                }
            });
        } else {
            authKeys.createAuth(userEntity._id.toString(), callback);
        }
    };

    this.removeAuthKeys = function(userEntity, callback) {
        if (userEntity._id) {
            authKeys.removeAllAuth(userEntity._id.toString(), callback);
        }
    };

    var defaultAdmin = config.get("admin");


    // init
    (function(self){
        var adminconfig = config.get("admin");
        if (adminconfig && adminconfig.login && adminconfig.password) {
            self.loadUserByLogin(adminconfig.login, function (err, user) {
                if (!err && !user) {
                    user = {login: adminconfig.login, admin: true };
                    self.setHashPassword(user, adminconfig.password, function(err, h) {
                        if (!err) {
                            self.save(user, function(err, user) {
                                console.log("Admin user ", adminconfig, "added to the database");
                            });
                        }
                    })
                }
            });
        }
    })(this);

}

Users.prototype = new persist.CollectionAccessPrototype("users");

module.exports = new Users();