const { concatSeries } = require("async");

exports.get_settings = function (req, res, next) {

    let params = req.params;
    let internalData = {};

    async.series([
        function (do_callback) {

            // get settings
            req.connection.query(`SELECT * FROM settings LIMIT 1`, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {
                    internalData.settings = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get admin user infor
            let query = `SELECT margin_per, margin_fix FROM users WHERE role='Admin'`;
            req.connection.query(query, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.user = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            internalData.data = {
                app_name: internalData.settings.app_name,
                is_bat_allowed: internalData.settings.is_bat_allowed,
                user_max_profit_on_session: internalData.settings.user_max_profit_on_session,
                user_max_profit_on_odds: internalData.settings.user_max_profit_on_odds,
                margin_per: internalData.user.margin_per,
                margin_fix: internalData.user.margin_fix,
            };
            
            do_callback();
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Settings',
                data: internalData.data
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.update_settings = function (req, res, next) {

    let params = req.body;
    let internalData = {};

    async.series([
        function (do_callback) {

            let data = {
                app_name: params.app_name,
                is_bat_allowed: params.is_bat_allowed,
                user_max_profit_on_session: params.user_max_profit_on_session,
                user_max_profit_on_odds: params.user_max_profit_on_odds,
            };

            // get settings
            req.connection.query(`UPDATE settings SET ? WHERE id=1`, data, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            let data = {
                margin_per: params.margin_per,
                margin_fix: params.margin_fix,
            };

            // remove session
            req.connection.query(`UPDATE users SET ? WHERE role='Admin'`, data, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    do_callback();
                }
            });
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Settings updated successfully',
                data: internalData.data
            }
            helper.sendResponse(req, res, result);
        }
    });
}
