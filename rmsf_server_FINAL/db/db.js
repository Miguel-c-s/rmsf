var mysql = require('mysql');

// data base configurations
var connection = mysql.createPool({
    host     : 'url',
    user     : 'user',
    password : 'pass',
    database : 'db'
});

module.exports.connection = connection;