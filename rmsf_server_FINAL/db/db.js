var mysql = require('mysql');

// data base configurations
var connection = mysql.createPool({
    host     : '***REMOVED***',
    user     : '***REMOVED***',
    password : '***REMOVED***',
    database : '***REMOVED***'
});

module.exports.connection = connection;