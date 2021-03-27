var restify = require('restify');
global.mysql = require('mysql');
global.config = require('./config/config');
global.database = require('./config/database');
global.helper = require('./functions/helper');
global.permission = require('./functions/permission');
global.async = require("async");
global.PHPUnserialize = require('php-unserialize');
global.CronJob = require('cron').CronJob;
global.c = console;
var users = require('./controllers/users');
var credits = require('./controllers/credits');
var sports = require('./controllers/sports');
var series = require('./controllers/series');
var matches = require('./controllers/matches');
var sessions = require('./controllers/sessions');
var bats = require('./controllers/bats');
var settings = require('./controllers/settings');
var advertisements = require('./controllers/advertisements');

/**
 * create server
 */
var server = restify.createServer();

/**
 * socket server configration 
 */
// const httpServer = require('http').createServer();
// const io = require('socket.io')(httpServer);
// io.on("connection", socket => {
//   // either with send()
//   socket.send("Hello!");

//   // or with emit() and custom event names
//   socket.emit("greetings", "Hey!", { "ms": "jane" }, Buffer.from([4, 3, 3, 1]));

//   // handle the event sent with socket.send()
//   socket.on("message", (data) => {
//     console.log(data);
//   });

//   // handle the event sent with socket.emit()
//   socket.on("salutations", (elem1, elem2, elem3) => {
//     console.log(elem1, elem2, elem3);
//   });
// });
// httpServer.listen(3003, function () {
//   console.log('Http server listening on port 3003');
// });

const io = require('socket.io')();
io.on('connection', client => { 
  client.on('event', data => { message: 'Hello' });
  client.on('disconnect', () => { message: 'Connection end' });
 });
io.listen(3003);

/**
 * handle cors middleware 
 */
const corsMiddleware = require('restify-cors-middleware');
const config = require('./config/config');
 
const cors = corsMiddleware({
  preflightMaxAge: 5, //Optional
  origins: ['http://localhost:3000', 'http://localhost', 'localhost:3000', '*'],
  allowHeaders: ['Authorization'],
  exposeHeaders: ['Authorization']
})

server.pre(cors.preflight)
server.use(cors.actual)

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.authorizationParser());
server.use(restify.plugins.dateParser());
server.use(restify.plugins.queryParser());
server.use(restify.plugins.jsonp());
server.use(restify.plugins.gzipResponse());
server.use(restify.plugins.bodyParser());

// check body/params 
server.use(helper.vewRequest);

// add database connection in req object
server.use(database.createDatabaseConnection);

// auth
server.post('/login', users.login);
server.get('/logout', users.logout);

// sports   
server.get('/sports/listing', permission.isAuthenticate, sports.listing);
server.put('/sports/change-status/:sports_id/:status', permission.isAuthenticate, permission.isAdmin, sports.change_status);

// series
server.get('/series/listing', permission.isAuthenticate, series.listing);
server.put('/series/change-status/:series_id/:status', permission.isAuthenticate, permission.isAdmin, series.change_status);
server.put('/series/delete/:series_id', permission.isAuthenticate, permission.isAdmin, series.delete);

// matches
server.get('/matches/listing', permission.isAuthenticate, matches.listing);
server.put('/matches/change-status/:match_id/:status', permission.isAuthenticate, permission.isAdmin, matches.change_status);
server.put('/matches/delete/:match_id', permission.isAuthenticate, permission.isAdmin, matches.delete);
server.get('/matches/in-play', permission.isAuthenticate, permission.isPlayer, matches.in_play);
server.get('/matches/user-match-odds/:event_id', permission.isAuthenticate, permission.isPlayer, matches.UserMatchOdds);

// bats
server.get('/bats/user-match-bats/:event_id', permission.isAuthenticate, permission.isPlayer, bats.UserMatchBats);
server.put('/bats/delete/:event_id', permission.isAuthenticate, bats.delete);
server.post('/bats/save', permission.isAuthenticate, permission.isPlayer, bats.save);
server.get('/bats/user-match-score/:event_id', permission.isAuthenticate, permission.isPlayer, bats.getUserMatchScore);

// sessions
server.get('/sessions/listing/:event_id', permission.isAuthenticate, sessions.listing);
server.put('/sessions/add-remove/:session_id/:status', permission.isAuthenticate, permission.isAdmin, sessions.add_remove);
server.put('/sessions/abandoned/:session_id', permission.isAuthenticate, permission.isAdmin, sessions.abandoned);

// sub-admins 
server.post('/sub-admins/create-account', permission.isAuthenticate, permission.isAdmin, users.create_account);
server.get('/sub-admins/list/:type', permission.isAuthenticate, permission.isAdmin, users.list_users);
server.get('/sub-admins/archive/:type', permission.isAuthenticate, permission.isAdmin, users.archive_users);
server.get('/sub-admins/detail-account/:user_id', permission.isAuthenticate, permission.isAdmin, users.detail_account);
server.post('/sub-admins/update-account', permission.isAuthenticate, permission.isAdmin, users.update_account);
server.post('/sub-admins/change-password', permission.isAuthenticate, permission.isAdmin, users.change_password);
server.put('/sub-admins/change-status/:user_id/:status', permission.isAuthenticate, permission.isAdmin, users.change_status);
server.put('/sub-admins/delete-account/:user_id', permission.isAuthenticate, permission.isAdmin, users.delete_account);
server.put('/sub-admins/restore-account/:user_id', permission.isAuthenticate, permission.isAdmin, users.restore_account);

// masters 
server.post('/masters/create-account', permission.isAuthenticate, permission.isSubAdmin, users.create_account);
server.get('/masters/list/:type', permission.isAuthenticate, permission.isSubAdmin, users.list_users);
server.get('/masters/archive/:type', permission.isAuthenticate, permission.isSubAdmin, users.archive_users);
server.get('/masters/detail-account/:user_id', permission.isAuthenticate, permission.isSubAdmin, users.detail_account);
server.post('/masters/update-account', permission.isAuthenticate, permission.isSubAdmin, users.update_account);
server.post('/masters/change-password', permission.isAuthenticate, permission.isSubAdmin, users.change_password);
server.put('/masters/change-status/:user_id/:status', permission.isAuthenticate, permission.isSubAdmin, users.change_status);
server.put('/masters/delete-account/:user_id', permission.isAuthenticate, permission.isSubAdmin, users.delete_account);
server.put('/masters/restore-account/:user_id', permission.isAuthenticate, permission.isSubAdmin, users.restore_account);
server.post('/masters/add-credit', permission.isAuthenticate, permission.isSubAdmin, users.add_credit);
server.post('/masters/withdraw-credit', permission.isAuthenticate, permission.isSubAdmin, users.withdraw_credit);

// players 
server.post('/players/create-account', permission.isAuthenticate, permission.isMaster, users.create_account);
server.get('/players/list/:type', permission.isAuthenticate, permission.isMaster, users.list_users);
server.get('/players/archive/:type', permission.isAuthenticate, permission.isMaster, users.archive_users);
server.get('/players/detail-account/:user_id', permission.isAuthenticate, permission.isMaster, users.detail_account);
server.post('/players/update-account', permission.isAuthenticate, permission.isMaster, users.update_account);
server.post('/players/change-password', permission.isAuthenticate, permission.isMaster, users.change_password);
server.put('/players/change-status/:user_id/:status', permission.isAuthenticate, permission.isMaster, users.change_status);
server.put('/players/delete-account/:user_id', permission.isAuthenticate, permission.isMaster, users.delete_account);
server.put('/players/restore-account/:user_id', permission.isAuthenticate, permission.isMaster, users.restore_account);
server.post('/players/add-credit', permission.isAuthenticate, permission.isMaster, users.add_credit);
server.post('/players/withdraw-credit', permission.isAuthenticate, permission.isMaster, users.withdraw_credit);
server.put('/players/change-betting-status/:user_id/:betting_status', permission.isAuthenticate, permission.isMaster, users.change_betting_status);
server.get('/players/get-advertisements', permission.isAuthenticate, advertisements.get_advertisements);

// advertisements
server.get('/advertisements/listing', permission.isAuthenticate, permission.isAdmin, advertisements.listing);
server.post('/advertisements/create', permission.isAuthenticate, permission.isAdmin, advertisements.create);
server.get('/advertisements/detail/:id', permission.isAuthenticate, permission.isAdmin, advertisements.detail);
server.post('/advertisements/update', permission.isAuthenticate, permission.isAdmin, advertisements.update);
server.put('/advertisements/change-status/:id/:status', permission.isAuthenticate, permission.isAdmin, advertisements.change_status);
server.put('/advertisements/delete/:id', permission.isAuthenticate, permission.isAdmin, advertisements.delete);

// common
server.get('/credits/history', permission.isAuthenticate, credits.history);

// settings
server.post('/settings/update-account-settings', permission.isAuthenticate, users.update_account_settings);
server.post('/settings/change-password', permission.isAuthenticate, users.change_password);
server.get('/settings/detail-account/:user_id', permission.isAuthenticate, users.detail_account);
server.post('/settings/update-account', permission.isAuthenticate, users.update_account);
server.get('/settings/get-global-settings', permission.isAuthenticate, permission.isAdmin, settings.get_settings);
server.post('/settings/update-global-settings', permission.isAuthenticate, permission.isAdmin, settings.update_settings);
server.post('/settings/update-stakes', permission.isAuthenticate, permission.isPlayer, users.update_stakes);

server.get('/list_sub_admin_wise_masters/:parent_id', permission.isAuthenticate, permission.isAdmin, users.list_sub_admin_wise_masters);
server.get('/list_master_wise_players/:parent_id', permission.isAuthenticate, users.list_master_wise_players);

/**
 * mound a server on specific port 
 */
server.listen(config.port, function () {
  console.log('%s listening at %s', config.appName, config.baseUrl);
});
