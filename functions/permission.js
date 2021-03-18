
exports.isAuthenticate = (req, res, next) => {

    try {
        let authorization = req.header('authorization');

        if(typeof authorization === 'undefined') {
            helper.sendErrorResponse(req, res, 'You have provided invalid OAuth details.');
            return next(false);
        }

        let token = authorization.replace('Bearer ', '');

        let query = `SELECT UserToken.user_id, User.* FROM user_tokens UserToken JOIN users User ON UserToken.user_id=User.id WHERE UserToken.token='${token}' AND User.deleted_at IS NULL`;
        req.connection.query(query, function (err, results) {
            if (err) {

                helper.sendErrorResponse(req, res, err);                
                return next(false);
            }
            else if (!results.length) {

                helper.sendErrorResponse(req, res, 'Authentication error.');
                return next(false);
            }
            else if (!results[0].status) {

                helper.sendErrorResponse(req, res, 'Your account in-active, please contact to administrator.');
                return next(false);
            }
            else {

                global.currentUser = results[0];
                return next();
            }
        });
    }
    catch (err) {

        helper.sendErrorResponse(req, res, err);
        return next(false);
    }
}

exports.isAdmin = (req, res, next) => {

    if (currentUser.role !== 'Admin') {
        
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');
        return next(false);
    } else {
        return next();
    }

    let user_id = 0;

    if (typeof req.body !== 'undefined' && typeof req.body.user_id !== 'undefined') {
        user_id = req.body.user_id;
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.user_id !== 'undefined') {
        user_id = req.params.user_id;
    }

    if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type == 'Sub-Admin') {
        return next();
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type != 'Sub-Admin') {
        helper.sendErrorResponse(req, res, 'You can access only sub-admins.');
        return next(false);
    }
    else if (user_id) {

        let query = `SELECT id,role FROM users WHERE id=${user_id}`;
        req.connection.query(query, function (err, results) {
            if (err) {

                helper.sendErrorResponse(req, res, err);

                return next(false);
            }
            else if (!results.length) {

                helper.sendErrorResponse(req, res, 'Action user not found.');

                return next(false);
            }
            else if (results[0].role == 'Sub-Admin') {

                return next();
            }
            else {

                helper.sendErrorResponse(req, res, 'Action on invalid user.');

                return next(false);
            }
        });
    }
    else if (currentUser.role == 'Admin') {
        return next();
    } 
    else {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');

        return next(false);
    }
}

exports.isSubAdmin = (req, res, next) => {

    if (currentUser.role !== 'Sub-Admin') {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');
        return next(false);
    } else {
        return next();
    }

    let user_id = 0;

    console.log('req.params:::::', req.params)
    console.log('req.body:::::', req.body)

    if (typeof req.body !== 'undefined' && typeof req.body.user_id !== 'undefined') {
        user_id = req.body.user_id;
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.user_id !== 'undefined') {
        user_id = req.params.user_id;
    }

    if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type == 'Master') {
        return next();
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type != 'Master') {
        helper.sendErrorResponse(req, res, 'You can access only masters.');
        return next(false);
    }
    else if (user_id) {

        let query = `SELECT id,role FROM users WHERE id=${user_id}`;
        req.connection.query(query, function (err, results) {
            if (err) {

                helper.sendErrorResponse(req, res, err);

                return next(false);
            }
            else if (!results.length) {

                helper.sendErrorResponse(req, res, 'Action user not found.');

                return next(false);
            }
            else if (results[0].role == 'Master') {

                return next();
            }
            else {

                helper.sendErrorResponse(req, res, 'Action on invalid user.');

                return next(false);
            }
        });
    }
    else if (currentUser.role == 'Sub-Admin') {
        return next();
    } 
    else {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');

        return next(false);
    }
}

exports.isMaster = (req, res, next) => {

    if (currentUser.role !== 'Master') {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');

        return next(false);
    } else {
        return next();
    }

    let user_id = 0;

    console.log('req.params:::::', req.params)
    console.log('req.body:::::', req.body)

    if (typeof req.body !== 'undefined' && typeof req.body.user_id !== 'undefined') {
        user_id = req.body.user_id;
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.user_id !== 'undefined') {
        user_id = req.params.user_id;
    }

    if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type == 'Master') {
        return next();
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type != 'Master') {
        helper.sendErrorResponse(req, res, 'You can access only masters.');
        return next(false);
    }
    else if (user_id) {

        let query = `SELECT id,role FROM users WHERE id=${user_id}`;
        req.connection.query(query, function (err, results) {
            if (err) {

                helper.sendErrorResponse(req, res, err);

                return next(false);
            }
            else if (!results.length) {

                helper.sendErrorResponse(req, res, 'Action user not found.');

                return next(false);
            }
            else if (results[0].role == 'Master') {

                return next();
            }
            else {

                helper.sendErrorResponse(req, res, 'Action on invalid user.');

                return next(false);
            }
        });
    }
    else if (currentUser.role == 'Sub-Admin') {
        return next();
    } 
    else {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');

        return next(false);
    }
}

exports.isPlayer = (req, res, next) => {

    if (currentUser.role !== 'Player') {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');

        return next(false);
    } else {
        return next();
    }

    let user_id = 0;

    console.log('req.params:::::', req.params)
    console.log('req.body:::::', req.body)

    if (typeof req.body !== 'undefined' && typeof req.body.user_id !== 'undefined') {
        user_id = req.body.user_id;
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.user_id !== 'undefined') {
        user_id = req.params.user_id;
    }

    if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type == 'Master') {
        return next();
    }
    else if (typeof req.params !== 'undefined' && typeof req.params.type != 'undefined' && req.params.type != 'Master') {
        helper.sendErrorResponse(req, res, 'You can access only masters.');
        return next(false);
    }
    else if (user_id) {

        let query = `SELECT id,role FROM users WHERE id=${user_id}`;
        req.connection.query(query, function (err, results) {
            if (err) {

                helper.sendErrorResponse(req, res, err);

                return next(false);
            }
            else if (!results.length) {

                helper.sendErrorResponse(req, res, 'Action user not found.');

                return next(false);
            }
            else if (results[0].role == 'Master') {

                return next();
            }
            else {

                helper.sendErrorResponse(req, res, 'Action on invalid user.');

                return next(false);
            }
        });
    }
    else if (currentUser.role == 'Sub-Admin') {
        return next();
    } 
    else {
        helper.sendErrorResponse(req, res, 'You are not authorized to access this location.');

        return next(false);
    }
}
