var express = require('express')
const app = express();
global.async = require("async");
global.config = require('./config/config');
global.socketDBConnection = require('./config/socketConnection');

const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});;
var matches = require('./controllers/matches');

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-with, Accept, Authorization, authorization');
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET, POST, PUT, DELETE');
  next();
});
/**
 * create server
 */
http.listen(config.socketPort, () => {
  console.log(`listening on port: `, config.socketPort);
});


io.on('connection', client => {
  console.log("A user connected!!");

  setInterval(() => {
    console.log('Event ID:', client.handshake.query['eventID']);
    //DataTransfer({data:socket.handshake.query['eventID']})
    matches.UserMatchOdds(client.handshake.query['eventID'], result => {
      client.emit('UserMatchOdds', result);
    })

  }, 1000);
  client.on('disconnect', () => {
    console.log("A user disconnected!!");
  });
});