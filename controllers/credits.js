
exports.history = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT UserCredit.*, User.name as creditor_name FROM user_credits UserCredit JOIN users User ON UserCredit.action_user_id = User.id WHERE UserCredit.user_id=${currentUser.id} ORDER BY UserCredit.id DESC`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        user_id: rowInfo.user_id,
                        creditor_id: rowInfo.action_user_id,
                        creditor_name: rowInfo.creditor_name,
                        credit: rowInfo.credit,
                        withdraw: rowInfo.withdraw,
                        remark: rowInfo.remark,
                        created_at: helper.getFormatedDate(rowInfo.created_at),
                        updated_at: helper.getFormatedDate(rowInfo.updated_at),
                    });
                });

                let result = {
                    status: true,
                    message: 'Credits History.',
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
