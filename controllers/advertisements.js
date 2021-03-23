
exports.get_advertisements = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT title, detailed_url FROM advertisements`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'List advertisements.',
                    data: results
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.listing = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT * FROM advertisements`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'List advertisements.',
                    data: results
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.create = async function (req, res, next) {

    try {
        let params = req.body;

        let data = {
            title: params.title,
            detailed_url: params.detailed_url,
            status: params.status,
            created_at: helper.getCurrentDate(),
            updated_at: helper.getCurrentDate(),
        };

        req.connection.query('INSERT INTO advertisements SET ?', data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Advertisement created successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.detail = function (req, res, next) {

    try {
        let params = req.params;

        let query = `SELECT * FROM advertisements WHERE id = ${params.id}`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Record not found.');
            }
            else {

                let result = {
                    status: true,
                    message: 'Detail row.',
                    data: results[0],
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.update = function (req, res, next) {

    try {
        let params = req.body;

        let data = {
            title: params.title,
            detailed_url: params.detailed_url,
            updated_at: helper.getCurrentDate(),
        }
        
        req.connection.query(`UPDATE advertisements SET ? WHERE id=${params.id}`, data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Record updated successfully.',
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

        let query = `UPDATE advertisements SET status=${params.status}, updated_at='${helper.getCurrentDate()}' WHERE id=${params.id}`;
        req.connection.query(query, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Record status updated successfully.',
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

        let query = `DELETE FROM advertisements WHERE id=${params.id}`;
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
