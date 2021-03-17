

exports.listing = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT Series.*, Sport.sports_name FROM series Series JOIN sports Sport ON Series.sports_id = Sport.id WHERE Series.deleted_at IS NULL`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        sports_id: rowInfo.sports_id,
                        sports_name: rowInfo.sports_name,
                        competition_id: rowInfo.competition_id,
                        competition_name: rowInfo.competition_name,
                        marketCount: rowInfo.marketCount,
                        competitionRegion: rowInfo.competitionRegion,
                        status: rowInfo.status,
                    });
                });

                let result = {
                    status: true,
                    message: 'List series.',
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

        let query = `UPDATE series SET status=${params.status}, updated_at='${helper.getCurrentDate()}' WHERE id=${params.series_id}`;
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

        let query = `UPDATE series SET deleted_at='${helper.getCurrentDate()}', updated_at='${helper.getCurrentDate()}' WHERE id=${params.match_id}`;
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
