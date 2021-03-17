

exports.listing = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT * FROM sports`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        sports_name: rowInfo.sports_name,
                        marketCount: rowInfo.marketCount,
                        status: rowInfo.status,
                    });
                });

                let result = {
                    status: true,
                    message: 'List sports.',
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

        let query = `UPDATE sports SET status=${params.status}, updated_at='${helper.getCurrentDate()}' WHERE id=${params.sports_id}`;
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
