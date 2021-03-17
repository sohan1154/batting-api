
exports.listing = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT Matches.*, Series.competition_name, Sports.sports_name FROM matches Matches JOIN series Series ON Matches.series_id = Series.id JOIN sports Sports ON Series.sports_id = Sports.id WHERE Matches.deleted_at IS NULL`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        series_id: rowInfo.series_id,
                        event_id: rowInfo.event_id,
                        event_name: rowInfo.event_name,
                        sports_name: rowInfo.sports_name,
                        competition_name: rowInfo.competition_name,
                        event_country_code: rowInfo.event_country_code,
                        event_timezone: rowInfo.event_timezone,
                        event_open_date: rowInfo.event_open_date,
                        market_count: rowInfo.market_count,
                        scoreboard_id: rowInfo.scoreboard_id,
                        liability_type: rowInfo.liability_type,
                        undeclared_markets: rowInfo.undeclared_markets,
                        min_stake: rowInfo.min_stake,
                        max_stake: rowInfo.max_stake,
                        match_result: rowInfo.match_result,
                        status: rowInfo.status,
                    });
                });

                let result = {
                    status: true,
                    message: 'List matches.',
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

exports.change_status = function (req, res, next) {

    try {
        let params = req.params;

        let query = `UPDATE matches SET status=${params.status}, updated_at='${helper.getCurrentDate()}' WHERE id=${params.match_id}`;
        req.connection.query(query, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Status updated successfully.',
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

    try {
        let params = req.params;

        let query = `UPDATE matches SET deleted_at='${helper.getCurrentDate()}', updated_at='${helper.getCurrentDate()}' WHERE id=${params.match_id}`;
        req.connection.query(query, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Record deleted successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}
