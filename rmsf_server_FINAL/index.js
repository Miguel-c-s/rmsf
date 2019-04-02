var express = require('express');
var cors = require('cors');
var bodyParser = require("body-parser");
var app = express();
var port = 3000;

// JWT secret for signature validation
process.env.SECRET_KEY = "RMSF_SECRET_100010323"; 

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// files
var users = require('./routes/users');
var admin = require('./routes/admin');
var esp = require('./routes/esp');

// routes
app.use('/users', users);
app.use('/admin', admin);

// server initialization
app.listen(port, function(){
    console.log("Server is running on port: " + port);
});
