var express = require('express')
const app = express();
global.async = require("async");

const http = require('http').Server(app); 
const io = require('socket.io')(http, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });;
  var matches = require('./controllers/matches');

app.use((req, res, next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers','Origin, X-Requested-with, Accept, Authorization, authorization');
  res.header('Access-Control-Allow-Methods','OPTIONS,GET, POST, PUT, DELETE');
   next();
});
/**
 * create server
 */
 http.listen(3002, () => {
  console.log(`listening on *`);
});


io.on('connection', client => {
  console.log("A user connected!!");
  
  setInterval(() => {
    console.log(client.handshake.query['foo']);
  //DataTransfer({data:socket.handshake.query['foo']})
  matches.UserMatchOddstest(client.handshake.query['foo'],result=>{
    client.emit('event', result);
  })
  
  },1000);
  client.on('disconnect', () => { 
    console.log("A user disconnected!!");
  });
});