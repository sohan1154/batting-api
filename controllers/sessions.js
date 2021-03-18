
exports.listing = function (req, res, next) {

    try {
        let params = req.params;

        let query = `SELECT * FROM match_sessions WHERE event_id=${params.event_id} AND is_abandoned=0`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {

                    rows.push({
                        session_id: rowInfo.id,
                        match_id: rowInfo.match_id,
                        event_id: rowInfo.event_id,
                        RunnerName: rowInfo.RunnerName,
                        GameStatus: rowInfo.GameStatus,
                        SelectionId: rowInfo.SelectionId,
                        is_allowed: rowInfo.is_allowed,
                        is_abandoned: rowInfo.is_abandoned,
                    });
                });

                let result = {
                    status: true,
                    message: 'Match sessions.',
                    data: rows
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.add_remove = function (req, res, next) {

    let params = req.params;
    let status = parseInt(params.status);
    let internalData = {};

    async.series([
        function (do_callback) {

            // add session
            if(status) {
                let query = `UPDATE match_sessions SET is_allowed=1, updated_at='${helper.getCurrentDate()}' WHERE id=${params.session_id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {

                        internalData.message = 'Session added successfully.';
                        do_callback();
                    }
                });
            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // remove session
            if(!status) {
                let query = `UPDATE match_sessions SET is_allowed=0, updated_at='${helper.getCurrentDate()}' WHERE id=${params.session_id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {

                        internalData.message = 'Session removed successfully.';
                        do_callback();
                    }
                });
            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // return credits to all users if any bat is going on for the session (at session removing time only)
            do_callback();

        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: internalData.message,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.abandoned = function (req, res, next) {

    let params = req.params;
    let internalData = {};

    async.series([
        function (do_callback) {

            let query = `UPDATE match_sessions SET is_abandoned=1, updated_at='${helper.getCurrentDate()}' WHERE id=${params.session_id}`;
            req.connection.query(query, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            // return credits on users account if any bat is going on for the session
            do_callback();

        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Session abandoned successfully.',
            }
            helper.sendResponse(req, res, result);
        }
    });
}
