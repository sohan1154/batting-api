
exports.UserMatchBats = function (req, res, next) {

    try {
        let params = req.params;

        let query = `SELECT * FROM user_bats WHERE user_id=${currentUser.id} AND event_id=${params.event_id} AND deleted_at IS NULL`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let odds = [];
                let sessions = [];
                async.forEach(results, (rowInfo) => {

                    if (rowInfo.match_session_id) {
                        sessions.push(rowInfo);
                    } else {
                        odds.push(rowInfo);
                    }
                });

                let result = {
                    status: true,
                    message: 'User Match Bats.',
                    odds: odds,
                    sessions: sessions
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.delete = function (req, res, next) {

    let params = req.params;
    let internalData = {};

    async.series([
        function (do_callback) {

            // get user info and check the user is valid or not to delete the bat
            let query = `SELECT * FROM users WHERE d=${currentUser.id}`;

            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.sessions = results;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // delete bat
            let query = `UPDATE user_bats SET deleted_at='${helper.getCurrentDate()}', action_user_id=${currentUser.id} WHERE bat_id=${params.bat_id}`;
            req.connection.query(query, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            // refund the bat amount to the user
            do_callback();
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Bat deleted successfully',
            }
            helper.sendResponse(req, res, result);
        }
    });
}
