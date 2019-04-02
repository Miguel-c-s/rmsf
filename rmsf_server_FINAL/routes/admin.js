var express = require('express');
var admin = express.Router();
var db = require('../db/db');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://rmsf.hadrons.xyz'); // MQTT connection

var token;

// global variables
global.buzzTime = 10;
global.connectTime = 10;
global.alarmReactivate = 10;
global.state = 1;

admin.use(cors());


// protected routes by token
admin.use(function (req, res, next) {
    var token = req.body.token || req.headers['token'];
    var appData = {};
    if (token) {
        // verify if the token is valid
        jwt.verify(token, process.env.SECRET_KEY, function (err) {
            if (err) {
                // error message
                appData["error"] = 1;
                appData["data"] = "Token is invalid";
                res.status(500).json(appData);
            } else {
                next();
            }
        });
    } else {
        // error message
        appData["error"] = 1;
        appData["data"] = "Please send a token";
        res.status(403).json(appData);
    }
});


// route /admin/logs
// get logs
admin.post('/logs', function (req, res) {
    var token = req.body.token || req.headers['token'];

    // token decode
    var decoded = jwt.decode(token);

    var appData = {};

    // verify if the token belogns to someone with admin permissions
    if (decoded.admin == 1) {
        // database connection
        db.connection.getConnection(function (err, connection) {
            if (err) {
                // error message
                appData["error"] = 1;
                appData["data"] = "Internal Server Error";
                res.status(500).json(appData);
            } else {
                // logs query
                connection.query('SELECT * FROM rmsf_logs', function (err, rows, fields) {
                    if (!err) {
                        appData["error"] = 0;
                        appData["data"] = rows;
                        res.status(200).json(appData);
                    } else {
                        appData.error = 1;
                        appData["data"] = "No logs in store";
                        res.status(200).json(appData);
                    }
                });
                connection.release();
            }
        });
    } else {
        // error message if the user isn't an admin
        appData["error"] = 1;
        appData["data"] = "Forbidden";
        res.status(403).json(appData);
    }
});


// route /admin/buzzer
// activate buzzer
admin.post('/buzzer', function (req, res) {
    var token = req.body.token || req.headers['token'];
    var decoded = jwt.decode(token);

    var appData = {};

    if (decoded.admin == 1) {
        // MQTT publish
        client.publish('buzzer', 'on');
        appData.error = 0;
        // http response
        appData["data"] = "Activated";
        res.status(200).json(appData);
    } else {
        // error message
        appData["error"] = 1;
        appData["data"] = "Forbidden";
        res.status(403).json(appData);
    }
});


// route /admin/enableAlarm
// change alarm state to on
admin.post('/enableAlarm', function (req, res) {
    var token = req.body.token || req.headers['token'];
    var decoded = jwt.decode(token);

    var appData = {};

    if (decoded.admin == 1) {
        // MQTT publish -> change state to 1
        client.publish('state', '1');
        state = 1;

        appData.error = 0;
        // http response
        appData["data"] = "Alarm triggereds";
        res.status(200).json(appData);

        // log creation
        var log = {
            "intrusion": 0,
            "datetime": new Date().toISOString().slice(0, 19).replace('T', ' '),
            "sensor": "on",
            "username" : decoded.username,
            "method" : "wifi"
        }
        // database connection
        db.connection.getConnection(function (err, connection) {
            if (err) {
                console.log("error connecting to database");
            } else {
                // insert into database
                connection.query('INSERT INTO rmsf_logs SET ?', log, function (err, rows, fields) {
                    if (err) {
                        console.log("error retrieving from database");
                    } else {
                        if (rows.length > 0) {
                        } 
                    }
                });
                connection.release();
            }
        });
    } else {
        // error message
        appData["error"] = 1;
        appData["data"] = "Forbidden";
        res.status(403).json(appData);
    }
});


// route /admin/disableAlarm
// change alarm state to off
admin.post('/disableAlarm', function (req, res) {
    var token = req.body.token || req.headers['token'];
    var decoded = jwt.decode(token);

    var appData = {};

    if (decoded.admin == 1) {
        // MQTT publish -> change state to 0
        client.publish('state', '0');
        state = 0
        appData.error = 0;
        appData["data"] = "Unlocked";
        res.status(200).json(appData);

        // log creation
        var log = {
            "intrusion": 0,
            "datetime": new Date().toISOString().slice(0, 19).replace('T', ' '),
            "sensor": "off",
            "username" : decoded.username,
            "method" : "wifi"
        }
        // database connection        
        db.connection.getConnection(function (err, connection) {
            if (err) {
                console.log("error connecting to database");
            } else {
                // insert into database                
                connection.query('INSERT INTO rmsf_logs SET ?', log, function (err, rows, fields) {
                    if (err) {
                        console.log("error retrieving from database");
                    } else {
                        if (rows.length > 0) {
                        } 
                    }
                });
                connection.release();
            }
        });
    } else {
        // error message
        appData["error"] = 1;
        appData["data"] = "Forbidden";
        res.status(403).json(appData);
    }
});


// route /admin/configs
// change alarm system configurations
admin.post('/configs', function (req, res) {

    var token = req.body.token || req.headers['token'];
    var decoded = jwt.decode(token);

    var appData = {};

    if (decoded.admin == 1) {
        // get timers from http request
        buzzTime = req.body.buzzTime;
        connectTime = req.body.connectTime;
        alarmReactivate = req.body.alarmReactivate;

        // http response
        appData["error"] = 0;
        appData["data"] = "successful";
        res.status(200).json(appData);
        console.log("changed configurations");
        console.log(buzzTime+'::'+connectTime+'::'+alarmReactivate);

        // send new configurations to microcontroller by MQTT
        client.publish('configs', buzzTime + ':' + connectTime + ':' + alarmReactivate);
    } else {
        // error message
        appData["error"] = 1;
        appData["data"] = "Forbidden";
        res.status(403).json(appData);
    }
});


// route /admin/savedInfo
// get saved configurations
admin.post('/savedInfo', function (req, res) {
    var token = req.body.token || req.headers['token'];
    var decoded = jwt.decode(token);

    var appData = {};

    if (decoded.admin == 1) {
        // http response
        appData.error = 0;
        appData["buzzTime"] = buzzTime;
        appData["connectTime"] = connectTime;
        appData["alarmReactivate"] = alarmReactivate;
        res.status(200).json(appData);
    } else {
        // error message
        appData["error"] = 1;
        appData["data"] = "Forbidden";
        res.status(403).json(appData);
    }
});

module.exports = admin;