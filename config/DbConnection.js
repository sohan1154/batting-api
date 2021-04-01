
const mysql = require('mysql');

const con = mysql.createConnection({
  host: "172.104.41.239",
  user: "bat",
  password:"Welcome@321",
  database: "bat"
});
con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
});
// con.end(function(err) {
//   if (err) throw err;
//   console.log("Disconnected!");
// });
module.exports = con;