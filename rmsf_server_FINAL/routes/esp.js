var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://rmsf.hadrons.xyz'); // MQTT connection
var db = require('../db/db');

// MQTT topics 
client.on('connect', function () {
  client.subscribe('presence');
  client.subscribe('bluetooth/login');
  client.subscribe('sensor');
  client.subscribe('startup');
})

// MQTT messages receiver
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString());

  // from microcontroller to confirm if credentials sent by bluetooth are valid
  if (topic.toString() === "bluetooth/login") {

    var stringSplit = message.toString().split(':');
    
    // slipt the message to get username and password
    if (stringSplit.length === 2) {
      var user = stringSplit[0];
      var pw = stringSplit[1];

      // database connection
      db.connection.getConnection(function (err, connection) {
        if (err) {
          console.log("error connecting to database");
        } else {
          // username query
          connection.query('SELECT * FROM rmsf_users WHERE username = ?', [user], function (err, rows, fields) {
            if (err) {
              console.log("error retrieving from database");
            } else {
              if (rows.length > 0) {
                // password verification
                if (rows[0].password == pw) {
                  // confirm that user is legit
                  // MQTT publish
                  client.publish("bluetooth/confirm", "1"); 
                  console.log("bluetooth/confirm=" + 1);

                  // log creation
                  var log = {
                    "intrusion": 0,
                    "datetime": new Date().toISOString().slice(0, 19).replace('T', ' '),
                    "sensor": null,
                    "username" : user,
                    "method" : "bluetooth"
                  }
                  // insert log
                  connection.query('INSERT INTO rmsf_logs SET ?', log, function (err, rows, fields) {
                    if (err) {
                      console.log("error retrieving from database");
                    } else {
                      if (rows.length > 0) {
                      } 
                    }
                  });
                  // if credentials aren't valid send error message by MQTT
                } else {
                  client.publish("bluetooth/confirm", "0");
                  console.log("bluetooth/confirm=" + 0);                  
                }
              } else {
                console.log("no user with such name");
              }
            }
          });
          connection.release();
        }
      });
    }
  }

  // from microcontroller asking for the configuration variables
  if (topic.toString() === "startup") {
    console.log("admin.buzzTime=" + buzzTime);

    // MQTT publish alarm state and timers
    client.publish('state', state.toString()); 
    client.publish('configs', buzzTime + ':' + connectTime + ':' + alarmReactivate);
  }

  // from microcontroller saying which sensor was triggered
  if (topic.toString() === "sensor") { 
    var sensorType = message.toString();

    // log creation
    var log = {
      "intrusion": 1,
      "datetime": new Date().toISOString().slice(0, 19).replace('T', ' '),
      "sensor": message.toString(),
      "username" : null,
      "method" : null
    }
    // database connection
    db.connection.getConnection(function (err, connection) {
      if (err) {
        console.log("error connecting to database");
      } else {
        // insert log into database
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
  }
})