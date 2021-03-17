var moment = require('moment'); // require
var momentTimezone = require('moment-timezone'); // require

exports.vewRequest = (req, res, next) => {
    console.log('###################### REQUEST ############################')
    console.warn('QUERY=>', req.query);
    console.warn('PARAMS=>', req.params);
    console.warn('BODY=>', req.body);

    return next();
}

exports.endDatabaseConnectionAndSendReponse = (req, res, message) => {

    // close database connection
    req.connection.end();

    // console.log('###################### CLOSE DATABASE CONNECTION AND SEND RESPONSE ############################')
    // console.log(message);

    if(typeof message == 'string') {
        message = {
            status: false,
            message: message,
        }
    }

    res.status(200);
    res.json(message);
}

exports.sendResponse = (req, res, data) => {

    // close database connection
    req.connection.end();

    console.log('###################### SUCCESS RESPONSE ############################')
    console.log('Response has been sent.');
    // console.log(data);

    res.status(200);
    res.json(data);
}

exports.sendErrorResponse = (req, res, err) => {

    console.error(err);

    let message = '';

    if (typeof err.code !== 'undefined') {

        console.log('Code:', err.code);

        switch (err.code) {
            case 'ER_DUP_ENTRY':
                message = 'Username is already taken, Please choose another and try again.';
                break;
            default:
                message = err.message;
        }
    }
    else if (typeof err.message !== 'undefined') {
        message = err.message;
    }
    else {
        message = err;
    }

    let data = {
        status: false,
        message: message
    };

    // close database connection
    req.connection.end();

    console.log('###################### ERROR RESPONSE ############################')
    console.log(data);

    res.status(203);
    res.json(data);
}

exports.generatePassword = (plaintextPassword, callback) => {
    let bcrypt = require('bcrypt');
    let saltRounds = 10;

    bcrypt.hash(plaintextPassword, saltRounds, function (err, hash) {
        if (err) {
            callback(err);
        } else {
            callback(null, hash);
        }
    });
}

exports.matchPassword = (plaintextPassword, hashPassword, callback) => {
    let bcrypt = require('bcrypt');
console.log('klasdjlakjdlajdlakjdlajsdlakjdlajdlkajldkjaldkajlsdjaldja')
    bcrypt.compare(plaintextPassword, hashPassword, function (err, result) {
        if (err) {
            callback(err);
        } else {
            callback(null, result);
        }
    });
}

exports.generateToken = (text) => {
    let crypto = require('crypto');
    let algorithm = 'aes-256-cbc';
    let key = crypto.randomBytes(32);
    let iv = crypto.randomBytes(16);

    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
}

exports.getFormatedDate = (date, format = "YYYY-MM-DD HH:mm:ss") => {
    return momentTimezone(date).utcOffset("+05:30").format(format);
}

exports.getCurrentDate = (format = "YYYY-MM-DD HH:mm:ss") => {
    return moment().format(format);
}

exports.getSerializedFormated = (jsonObj) => {

    if(!jsonObj || typeof jsonObj === 'undefined') {
        return NULL;
    }
    
    return null;
}
