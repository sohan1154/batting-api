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
var third_party_apis = require('./controllers/third_party_apis');
var sports = require('./controllers/sports');
var series = require('./controllers/series');
var matches = require('./controllers/matches');

/**
 * create server
 */
var server = restify.createServer();

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
server.get('/sports/listing', permission.isAuthenticate, permission.isAdmin, sports.listing);
server.put('/sports/change-status/:sports_id/:status', permission.isAuthenticate, permission.isAdmin, sports.change_status);
// series
server.get('/series/listing', permission.isAuthenticate, permission.isAdmin, series.listing);
server.put('/series/change-status/:series_id/:status', permission.isAuthenticate, permission.isAdmin, series.change_status);
server.put('/series/delete/:series_id', permission.isAuthenticate, permission.isAdmin, series.delete);
// matches
server.get('/matches/listing', permission.isAuthenticate, permission.isAdmin, matches.listing);
server.put('/matches/change-status/:match_id/:status', permission.isAuthenticate, permission.isAdmin, matches.change_status);
server.put('/matches/delete/:match_id', permission.isAuthenticate, permission.isAdmin, matches.delete);

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
server.put('/players/change-betting-status/:user_id/:betting_status', permission.isAuthenticate, permission.isMaster, users.change_betting_status);

// third party apis for tesing and display data
server.get('/call-third-party-apis/get-sports', third_party_apis.getSports);
server.get('/call-third-party-apis/get-series/:sportsID', third_party_apis.getSeries);
server.get('/call-third-party-apis/get-matches/:sportsID/:seriesID', third_party_apis.getMatches);
server.get('/call-third-party-apis/get-markets/:eventID', third_party_apis.getMarkets);
server.get('/call-third-party-apis/get-markets-selection/:marketID', third_party_apis.getMarketsSelection);
server.get('/call-third-party-apis/get-market-odds/:marketID', third_party_apis.getMarketOdds);
server.get('/call-third-party-apis/get-sessions/:matchID', third_party_apis.getSessions);
server.get('/call-third-party-apis/get-scores/:matchID', third_party_apis.getScores);

// third party apis for updating database
server.get('/call-third-party-apis/update-series', third_party_apis.updateSeries);
server.get('/call-third-party-apis/update-matches', third_party_apis.updateMatches);
server.get('/call-third-party-apis/update-markets', third_party_apis.updateMarkets);
server.get('/call-third-party-apis/update-market-odds', third_party_apis.updateMarketOdds);
server.get('/call-third-party-apis/update-sessions', third_party_apis.updateSessions); // pending
server.get('/call-third-party-apis/update-scores', third_party_apis.updateScores);

// cron will run on every 6 hours (12:00AM, 06:00AM, 12:00PM, 06:00PM) for updating Series, Matches & Markets
var job = new CronJob('* */6 * * *', function() {

  let axios = require('axios');

  console.log(' ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ')
  console.log(' update SERIES is called ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ')
  axios.get(config.baseUrl + 'call-third-party-apis/update-series');

  setTimeout(() => {
    console.log(' ---------------------------------------------------------------------------------------------------------------- ')
    console.log(' update MATCH is called ----------------------------------------------------------------------------------------- ')
    axios.get(config.baseUrl + 'call-third-party-apis/update-matches');
  }, 5*1000);

  setTimeout(() => {
    console.log(' +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ')
    console.log(' update MARKET is called +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+- ')
    axios.get(config.baseUrl + 'call-third-party-apis/update-markets');
  }, 10*1000);

}, null, true, 'Asia/Kolkata');
job.start();

// cron will run every second for updating Market-Odds & Match-Sessions
var job = new CronJob('* * * * * *', function() {

  let axios = require('axios');

  axios.get(config.baseUrl + 'call-third-party-apis/update-market-odds');
  axios.get(config.baseUrl + 'call-third-party-apis/update-sessions');

}, null, true, 'Asia/Kolkata');
job.start();

// cron will run every 5 seconds for updating Match Score
var job = new CronJob('*/5 * * * * *', function() {

  let axios = require('axios');

  axios.get(config.baseUrl + 'call-third-party-apis/update-scores');

}, null, true, 'Asia/Kolkata');
job.start();

// common
server.get('/credits/history', permission.isAuthenticate, credits.history);

// settings
server.post('/settings/update-account-settings', permission.isAuthenticate, users.update_account_settings);
server.post('/settings/change-password', permission.isAuthenticate, users.change_password);
server.get('/settings/detail-account/:user_id', permission.isAuthenticate, users.detail_account);
server.post('/settings/update-account', permission.isAuthenticate, users.update_account);

server.get('/list_sub_admin_wise_masters/:parent_id', permission.isAuthenticate, permission.isAdmin, users.list_sub_admin_wise_masters);
server.get('/list_master_wise_players/:parent_id', permission.isAuthenticate, users.list_master_wise_players);

/**
 * mound a server on specific port 
 */
server.listen(config.port, function () {
  console.log('%s listening at %s', config.appName, config.baseUrl);
});
