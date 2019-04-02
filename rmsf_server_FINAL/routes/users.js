var express = require('express');
var users = express.Router();
var db = require('../db/db');
var cors = require('cors')
var jwt = require('jsonwebtoken');
var token;

users.use(cors());


// route /users/register
// create a new user
// not used in the project, only for testing
users.post('/register', function(req, res){

    var appData = {
        "error": 1,
        "data": ""
    };

    // get data from http request
    var userData = {
        "username": req.body.username,
        "password": req.body.password,
        "admin": req.body.admin
    }

    // database connection
    db.connection.getConnection(function(err, connection){
        if(err){
            // error message
            appData["error"] = 1;
            appData["data"] = "Internal Server Error";
            res.status(500).json(appData);
        }else{
            // user insertion
            connection.query('INSERT INTO rmsf_users SET ?', userData, function(err, rows, fields){
                if(!err){
                    // http response
                    appData.error = 0;
                    appData["data"] = "User registered successfully!";
                    res.status(201).json(appData);
                }else{
                    // error message
                    appData["data"] = "Error Occured!";
                    res.status(400).json(appData);
                }
            });
            connection.release();
        }
    });
});


// route /users/login
// login to get a new token
users.post('/login', function(req, res){
    var appData = {};
    var username = req.body.username;
    var password = req.body.password;

    // database connection
    db.connection.getConnection(function(err, connection){
        if(err){
            appData["error"] = 1;
            appData["data"] = "Internal Server Error";
            res.status(500).json(appData);
        }else{
            // username query
            connection.query('SELECT * FROM rmsf_users WHERE username = ?', [username], function(err, rows, fields){
                if(err){
                    appData.error = 1;
                    appData["data"] = "Error Occured!";
                    res.status(400).json(appData);
                }else{
                    if(rows.length > 0){
                        // verify password
                        if(rows[0].password == password){
                            delete rows[0].password;
                            // create a new token
                            token = jwt.sign(JSON.parse(JSON.stringify(rows[0])), process.env.SECRET_KEY,{
                                expiresIn: 3600
                            });
                            // http response
                            appData.error = 0;
                            appData["token"] = token;
                            appData["admin"] = rows[0].admin;
                            res.status(200).json(appData);
                        }else{
                            // error message
                            appData.error = 1;
                            appData["data"] = "Username and Password does not match";
                            res.status(200).json(appData);
                        }
                    } else{
                        // error message
                        appData.error = 1;
                        appData["data"] = "Username does not exists!";
                        res.status(200).json(appData);
                    }
                }
            });
            connection.release();
        }
    });
});


// protected routes by token
users.use(function(req, res, next){
    var token = req.body.token || req.headers['token'];
    var appData = {};
    if(token){
        jwt.verify(token, process.env.SECRET_KEY, function(err){
            if(err){
                // error message
                appData["error"] = 1;
                appData["data"] = "Token is invalid";
                res.status(500).json(appData);
            }else{
                next();
            }
        });
    }else{
        // error message
        appData["error"] = 1;
        appData["data"] = "Please send a token";
        res.status(403).json(appData);
    }
});


// route /users/getUsers
// get a list of users
// not used in the project, only for testing
users.get('/getUsers', function(req, res){

    var appData = {};

    // database connection
    db.connection.getConnection(function(err, connection){
        if(err){
            appData["error"] = 1;
            appData["data"] = "Internal Server Error";
            res.status(500).json(appData);
        }else{
            // query
            connection.query('SELECT * FROM rmsf_users', function(err, rows, fields){
                if(!err){
                    // error message
                    appData["error"] = 0;
                    appData["data"] = rows;
                    res.status(200).json(appData);
                }else{
                    appData["data"] = "No data found";
                    res.status(200).json(appData);
                }
            });
            connection.release();
        }
    });
});

module.exports = users;