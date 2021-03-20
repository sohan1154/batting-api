
exports.login = function (req, res, next) {

    try {
        var params = req.body;

        let query = `SELECT * FROM users WHERE username='${params.username}' AND deleted_at IS NULL`;
        c.log('query:', query)
        req.connection.query(query, function (err, results) {
            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Invalid username.');
            }
            else if (!results[0].status) {
                helper.sendErrorResponse(req, res, 'Your account in-active, please contact to administrator.');
            }
            else {

                let rowInfo = results[0];

                helper.matchPassword(params.password, rowInfo.password, (err, status) => {
                    if (err) {
                        helper.sendErrorResponse(req, res, err);
                    }
                    else if (!status) {
                        helper.sendErrorResponse(req, res, 'Invalid password.');
                    }
                    else {
                        let data = {
                            id: rowInfo.id,
                            parent_id: rowInfo.parent_id,
                            role: rowInfo.role,
                            name: rowInfo.name,
                            username: rowInfo.username,
                            credit: rowInfo.credit,
                            margin_per: rowInfo.margin_per,
                            margin_fix: rowInfo.margin_fix,
                            email: rowInfo.email,
                            mobile: rowInfo.mobile,
                            address: rowInfo.address,
                            stakes: JSON.parse(rowInfo.stakes),
                            is_betting: rowInfo.is_betting,
                        }

                        manageToken(req, params, rowInfo, (err, token) => {

                            if (err) {
                                helper.sendErrorResponse(req, res, err);
                            } else {
                                let result = {
                                    status: true,
                                    message: 'Logged in successfully.',
                                    token: token,
                                    data: data,
                                }
                                helper.sendResponse(req, res, result);
                            }
                        });
                    }
                })
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

function manageToken(req, params, userInfo, callback) {

    let token = helper.generateToken(userInfo.id + userInfo.username);

    let query = `SELECT * FROM user_tokens WHERE user_id=${userInfo.id}`;
    req.connection.query(query, function (err, results) {
        console.log('results:', results)
        if (err) {
            callback(err);
        }
        else if (!results.length) {

            let data = {
                user_id: userInfo.id,
                token: token,
                created_at: helper.getCurrentDate(),
                updated_at: helper.getCurrentDate(),
            }
            req.connection.query(`INSERT INTO user_tokens SET ?`, data, function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, token);
                }
            });
        }
        else {

            // // MAIN CODE
            // let query = `UPDATE user_tokens SET token='${token}', updated_at='${helper.getCurrentDate()}' WHERE user_id=${userInfo.id}`;
            // c.log('query:', query)
            // req.connection.query(query, function (err, results) {
            //     console.log('results:', results)
            //     if (err) {
            //         callback(err);
            //     } else {
            //         callback(null, token);
            //     }
            // });

            // TEMPORARY CODE
            callback(null, results[0].token);
        }
    });
}

exports.logout = function (req, res, next) {

    try {
        let authorization = req.header('authorization');
        let token = authorization.replace('Bearer ', '');
        let query = `DELETE FROM user_tokens WHERE token='${token}'`;
        c.log('query:', query)
        req.connection.query(query, function (err, results) {
            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {
                let result = {
                    status: true,
                    message: 'Logout successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.create_account = async function (req, res, next) {

    try {
        let params = req.body;

        let isSetMargin = false;
        if (typeof params.margin_per !== 'undefined' || typeof params.margin_fix !== 'undefined') {
            isSetMargin = true;
        }

        let isCredit = false;
        if (typeof params.credit !== 'undefined' && params.credit > 0 && params.role !== 'Sub-Admin') {
            isCredit = true;
        }

        helper.generatePassword(params.password, (err, hashPassword) => {
            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                // if (isSetMargin && params.margin_per > 0 && params.margin_fix > 0) {
                //     helper.sendErrorResponse(req, res, 'You can not set both type margin at same time.');
                // }
                // else if (isSetMargin && params.margin_per > 100) {
                //     helper.sendErrorResponse(req, res, 'You can not set margin more then 100%');
                // }
                // else {

                    let data = {
                        parent_id: params.parent_id,
                        role: params.role,
                        name: params.name,
                        username: params.username,
                        password: hashPassword,
                        email: params.email,
                        mobile: params.mobile,
                        address: params.address,
                        stakes: JSON.stringify([100,200,500,1000,2000,5000,10000]),
                        is_betting: params.is_betting,
                        status: params.status,
                        created_at: helper.getCurrentDate(),
                        updated_at: helper.getCurrentDate(),
                    };

                    if (isSetMargin) {
                        if (params.margin_per != '' && params.margin_per > 0) {
                            data.margin_per = params.margin_per;
                            data.margin_fix = 0;
                        }
                        else if (params.margin_fix != '' && params.margin_fix > 0) {
                            data.margin_per = 0;
                            data.margin_fix = params.margin_fix;
                        }
                    }
                    if (isCredit) {
                        data.credit = params.credit;
                    }
                    if (typeof params.max_profit !== 'undefined' && params.max_profit > -1) {
                        data.max_profit = params.max_profit;
                    }
                    req.connection.query('INSERT INTO users SET ?', data, function (err, results) {

                        let insertId = results.insertId;

                        if (err) {
                            helper.sendErrorResponse(req, res, err);
                        } else {

                            // add credit into account 
                            if (isCredit) {
                                let data = {
                                    user_id: insertId,
                                    action_user_id: params.parent_id,
                                    credit: params.credit,
                                    remark: 'Credit added at account registration time.',
                                    created_at: helper.getCurrentDate(),
                                    updated_at: helper.getCurrentDate(),
                                }
                                req.connection.query('INSERT INTO user_credits SET ?', data, function (err, results) {

                                    if (err) {
                                        console.log('Account created, but error in create transaction for credit.');
                                    } else {
                                        console.log('Account created and Credit added into account.');
                                    }
                                });
                            }

                            let result = {
                                status: true,
                                message: 'Account created successfully.',
                            }
                            helper.sendResponse(req, res, result);
                        }
                    });
                // }
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.list_users = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT * FROM users WHERE role='${params.type}' AND parent_id=${currentUser.id} AND deleted_at IS NULL`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        parent_id: rowInfo.parent_id,
                        role: rowInfo.role,
                        name: rowInfo.name,
                        username: rowInfo.username,
                        credit: rowInfo.credit,
                        margin_per: rowInfo.margin_per,
                        margin_fix: rowInfo.margin_fix,
                        email: rowInfo.email,
                        mobile: rowInfo.mobile,
                        address: rowInfo.address,
                        status: rowInfo.status,
                        is_betting: rowInfo.is_betting,
                    });
                });

                let result = {
                    status: true,
                    message: 'List accounts.',
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

exports.archive_users = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT * FROM users WHERE role='${params.type}' AND parent_id=${currentUser.id} AND deleted_at IS NOT NULL`, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let rows = [];
                async.forEach(results, (rowInfo) => {
                    rows.push({
                        id: rowInfo.id,
                        parent_id: rowInfo.parent_id,
                        role: rowInfo.role,
                        name: rowInfo.name,
                        username: rowInfo.username,
                        credit: rowInfo.credit,
                        margin_per: rowInfo.margin_per,
                        margin_fix: rowInfo.margin_fix,
                        email: rowInfo.email,
                        mobile: rowInfo.mobile,
                        address: rowInfo.address,
                        status: rowInfo.status,
                        is_betting: rowInfo.is_betting,
                    });
                });

                let result = {
                    status: true,
                    message: 'Archived accounts.',
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

exports.detail_account = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = (currentUser.id == params.user_id) ? currentUser.id : params.user_id;

        let query = `SELECT * FROM users WHERE id = ${user_id} AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Account not found.');
            }
            else {

                let rowInfo = results[0];
                let data = {
                    id: rowInfo.id,
                    user_id: rowInfo.id,
                    parent_id: rowInfo.parent_id,
                    role: rowInfo.role,
                    name: rowInfo.name,
                    username: rowInfo.username,
                    credit: rowInfo.credit,
                    margin_per: rowInfo.margin_per,
                    margin_fix: rowInfo.margin_fix,
                    email: rowInfo.email,
                    mobile: rowInfo.mobile,
                    address: rowInfo.address,
                    max_profit: rowInfo.max_profit,
                    status: rowInfo.status,
                    is_betting: rowInfo.is_betting,
                    created_at: helper.getFormatedDate(rowInfo.created_at),
                    updated_at: helper.getFormatedDate(rowInfo.updated_at),
                }

                let result = {
                    status: true,
                    message: 'Detail account.',
                    data: data
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.update_account = function (req, res, next) {

    try {
        let params = req.body;
        let user_id = (currentUser.id == params.user_id) ? currentUser.id : params.user_id;
        let isSelf = (currentUser.id == params.user_id) ? true : false;

        let isSetMargin = false;
        if (typeof params.margin_per !== 'undefined' || typeof params.margin_fix !== 'undefined') {
            isSetMargin = true;
        }

        if (!isSelf && isSetMargin && params.margin_per > 0 && params.margin_fix > 0) {
            helper.sendErrorResponse(req, res, 'You can not set both type margin at same time.');
        }
        else if (!isSelf && isSetMargin && params.margin_per > 100) {
            helper.sendErrorResponse(req, res, 'You can not set margin more then 100%');
        }
        else {

            let data = {
                name: params.name,
                email: params.email,
                mobile: params.mobile,
                address: params.address,
                updated_at: helper.getCurrentDate(),
            }
            if (!isSelf && isSetMargin) {
                if (params.margin_per != '' && params.margin_per > 0) {
                    data.margin_per = params.margin_per;
                    data.margin_fix = 0;
                }
                else if (params.margin_fix != '' && params.margin_fix > 0) {
                    data.margin_per = 0;
                    data.margin_fix = params.margin_fix;
                }
            }
            if (!isSelf) {
                data.is_betting = params.is_betting;
                data.status = params.status;
            }
            if (typeof params.max_profit !== 'undefined' && params.max_profit > -1) {
                data.max_profit = params.max_profit;
            }
            req.connection.query(`UPDATE users SET ? WHERE id=${user_id}`, data, function (err, results) {

                if (err) {
                    helper.sendErrorResponse(req, res, err);
                } else {

                    let result = {
                        status: true,
                        message: 'Account updated successfully.',
                    }
                    helper.sendResponse(req, res, result);
                }
            });
        }
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.change_password = function (req, res, next) {

    var params = req.body;
    console.log(currentUser.id, '==', params.user_id);
    let user_id = (currentUser.id == params.user_id) ? currentUser.id : params.user_id;
    let isSelf = (currentUser.id == params.user_id) ? true : false;

    let internalData = {};

    async.series([
        // function (do_callback) {
        //     // create databae req.connection
        //     req.connection.connect(function (err) {
        //         if (err) {
        //             do_callback(err);
        //         } else {
        //             do_callback();
        //         }
        //     });
        // },
        function (do_callback) {
            let query = `SELECT * FROM users WHERE id = ${user_id}`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Account not found.');
                }
                else {
                    internalData.rowInfo = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {
            if (isSelf) {
                helper.matchPassword(params.old_password, internalData.rowInfo.password, (err, status) => {
                    if (err) {
                        do_callback(err);
                    }
                    else if (!status) {
                        do_callback('Old password are not match.');
                    }
                    else {
                        do_callback();
                    }
                });
            } else {
                do_callback();
            }
        },
        function (do_callback) {
            helper.generatePassword(params.password, (err, hashPassword) => {
                if (err) {
                    do_callback(err);
                } else {
                    internalData.hashPassword = hashPassword;
                    do_callback();
                }
            });
        },
        function (do_callback) {
            let query = `UPDATE users SET password='${internalData.hashPassword}', updated_at='${helper.getCurrentDate()}' WHERE id=${internalData.rowInfo.id}`;
            req.connection.query(query, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {
                    do_callback();
                }
            });
        },
    ], function (err) {
        // req.connection.end(); // end req.connection here 
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Password changed successfully.',
            }
            helper.sendResponse(req, res, result);
        }
    });

}

exports.change_status = function (req, res, next) {

    try {
        let params = req.params;

        let query = `UPDATE users SET status=${params.status}, updated_at='${helper.getCurrentDate()}' WHERE id=${params.user_id}`;
        req.connection.query(query, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Account status updated successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.change_betting_status = function (req, res, next) {

    try {
        let params = req.params;

        let query = `UPDATE users SET is_betting=${params.betting_status}, updated_at='${helper.getCurrentDate()}' WHERE id=${params.user_id}`;
        req.connection.query(query, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Batting status updated successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.delete_account = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = params.user_id;

        let query = `SELECT * FROM users WHERE id = ${user_id} AND deleted_at IS NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Account is not found, may be already deleted.');
            }
            else {

                let query = `UPDATE users SET deleted_at='${helper.getCurrentDate()}', updated_at='${helper.getCurrentDate()}' WHERE id=${user_id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        helper.sendErrorResponse(req, res, err);
                    } else {

                        let result = {
                            status: true,
                            message: 'Account deleted successfully.',
                        }
                        helper.sendResponse(req, res, result);
                    }
                });
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.restore_account = function (req, res, next) {

    try {
        let params = req.params;
        let user_id = params.user_id;

        let query = `SELECT * FROM users WHERE id = ${user_id} AND deleted_at IS NOT NULL`;
        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if (!results.length) {
                helper.sendErrorResponse(req, res, 'Account is not found, may be already restored.');
            }
            else {

                let query = `UPDATE users SET deleted_at=NULL, updated_at='${helper.getCurrentDate()}' WHERE id=${user_id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        helper.sendErrorResponse(req, res, err);
                    } else {

                        let result = {
                            status: true,
                            message: 'Account restored successfully.',
                        }
                        helper.sendResponse(req, res, result);
                    }
                });
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.add_credit = function (req, res, next) {

    let params = req.body;
    let internalData = {
        currentUserRemainingCredits: 0
    };

    async.series([
        function (do_callback) {

            // get user details
            let query = `SELECT id, role, parent_id, status, credit FROM users WHERE id = ${params.user_id} AND deleted_at IS NULL`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Account not found.');
                }
                else if (!results[0].status) {
                    do_callback('Account is in-active, please active this account first.');
                }
                else {
                    internalData.user = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get master details
            if(internalData.user.role == 'Player') {

                let query = `SELECT id, role, parent_id, status, credit FROM users WHERE role='Master' AND id = ${internalData.user.parent_id}`;
                req.connection.query(query, function (err, results, fields) {

                    if (err) {
                        do_callback(err);
                    }
                    else if (!results.length) {
                        do_callback('Master Account not found.');
                    }
                    else {
                        internalData.master = results[0];
                        do_callback();
                    }
                });
            }
            else if(internalData.user.role == 'Master') {
                do_callback();
            }
            else {
                do_callback('Please select proper user account.');
            }
        },
        function (do_callback) {

            // check master account balance
            if (currentUser.role == 'Master') {
                if(internalData.user.parent_id != currentUser.id) {
                    do_callback('You are not a parent of this account.');
                }
                else if (internalData.master.credit < parseInt(params.credit)) {
                    do_callback('Your account don\'t have sufficient credit.');
                }
                else {
                    do_callback();
                }
            }
            else if ((currentUser.role == 'Admin' || currentUser.role == 'Sub-Admin') && internalData.user.role == 'Player') {
                if (internalData.master.credit < parseInt(params.credit)) {
                    do_callback('Your masters account don\'t have sufficient credit.');
                }
                else {
                    do_callback();
                }
            }
            else if ((currentUser.role == 'Admin' || currentUser.role == 'Sub-Admin') && internalData.user.role == 'Master') {
                do_callback();
            }
            else {
                do_callback('You are not eligible to access this section.');
            }
        },
        function (do_callback) {

            // update user account credit
            internalData.endUserUpdatedCredits = (parseInt(internalData.user.credit) + parseInt(params.credit));
            let query = `UPDATE users SET credit='${internalData.endUserUpdatedCredits}', updated_at='${helper.getCurrentDate()}' WHERE id=${internalData.user.id}`;
            req.connection.query(query, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            // store credit history 
            let data = {
                user_id: params.user_id,
                action_user_id: params.action_user_id,
                credit: params.credit,
                withdraw: null,
                remark: params.remark,
                created_at: helper.getCurrentDate(),
                updated_at: helper.getCurrentDate(),
            }
            req.connection.query('INSERT INTO user_credits SET ?', data, function (err, results) {

                if (err) {
                    do_callback('Credit added into account.');
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            // update master account credit
            if(internalData.user.role == 'Player') {

                internalData.currentUserRemainingCredits = (parseInt(internalData.master.credit) - parseInt(params.credit));
                let query = `UPDATE users SET credit='${internalData.currentUserRemainingCredits}', updated_at='${helper.getCurrentDate()}' WHERE id=${internalData.master.id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {

                        do_callback();
                    }
                });
            } else {
                do_callback();
            }
        },
        
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Credit added into account.',
                currentUserRemainingCredits: internalData.currentUserRemainingCredits,
                endUserUpdatedCredits: internalData.endUserUpdatedCredits,
            }
            helper.sendResponse(req, res, result);
        }
    });

}

exports.withdraw_credit = function (req, res, next) {

    let params = req.body;
    let internalData = {
        currentUserRemainingCredits: 0
    };

    async.series([
        function (do_callback) {

            // get user details
            let query = `SELECT id, role, parent_id, status, credit FROM users WHERE id = ${params.user_id} AND deleted_at IS NULL`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Account not found.');
                }
                else if (!results[0].status) {
                    do_callback('Account is in-active, please active this account first.');
                }
                else {
                    internalData.user = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get master details
            if(internalData.user.role == 'Player') {

                let query = `SELECT id, role, parent_id, status, credit FROM users WHERE role='Master' AND id = ${internalData.user.parent_id}`;
                req.connection.query(query, function (err, results, fields) {

                    if (err) {
                        do_callback(err);
                    }
                    else if (!results.length) {
                        do_callback('Master Account not found.');
                    }
                    else {
                        internalData.master = results[0];
                        do_callback();
                    }
                });
            }
            else if(internalData.user.role == 'Master') {
                do_callback();
            }
            else {
                do_callback('Please select proper user account.');
            }
        },
        function (do_callback) {

            // check master account balance
            if (currentUser.role == 'Master') {
                if(internalData.user.parent_id != currentUser.id) {
                    do_callback('You are not a parent of this account.');
                }
                else if (internalData.user.credit < parseInt(params.credit)) {
                    do_callback('User account don\'t have sufficient credit.');
                }
                else {
                    do_callback();
                }
            }
            else if ((currentUser.role == 'Admin' || currentUser.role == 'Sub-Admin') && internalData.user.role == 'Master') {
                if (internalData.user.credit < parseInt(params.credit)) {
                    do_callback('Master account don\'t have sufficient credit.');
                }
                else {
                    do_callback();
                }
            }
            else {
                do_callback('You are not eligible to access this section.');
            }
        },
        function (do_callback) {

            // update user account credit
            internalData.endUserUpdatedCredits = (parseInt(internalData.user.credit) - parseInt(params.credit));
            let query = `UPDATE users SET credit='${internalData.endUserUpdatedCredits}', updated_at='${helper.getCurrentDate()}' WHERE id=${internalData.user.id}`;
            req.connection.query(query, function (err, results) {

                if (err) {
                    do_callback(err);
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            // store credit history 
            let data = {
                user_id: params.user_id,
                action_user_id: params.action_user_id,
                credit: null,
                withdraw: params.credit,
                remark: params.remark,
                created_at: helper.getCurrentDate(),
                updated_at: helper.getCurrentDate(),
            }
            req.connection.query('INSERT INTO user_credits SET ?', data, function (err, results) {

                if (err) {
                    do_callback('Credit withdrawn from account.');
                } else {

                    do_callback();
                }
            });
        },
        function (do_callback) {

            console.log('internalData.user::::::',internalData.user)
            console.log('internalData.master::::::',internalData.master)
            // update master account credit
            if(internalData.user.role == 'Player') {

                internalData.currentUserRemainingCredits = (parseInt(internalData.master.credit) + parseInt(params.credit));
                let query = `UPDATE users SET credit='${internalData.currentUserRemainingCredits}', updated_at='${helper.getCurrentDate()}' WHERE id=${internalData.master.id}`;
                req.connection.query(query, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {

                        do_callback();
                    }
                });
            } else {
                do_callback();
            }
        },
        
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Credit withdrawn from account.',
                currentUserRemainingCredits: internalData.currentUserRemainingCredits,
                endUserUpdatedCredits: internalData.endUserUpdatedCredits,
            }
            helper.sendResponse(req, res, result);
        }
    });

}

exports.update_account_settings = function (req, res, next) {

    try {
        let params = req.body;
        let user_id = (currentUser.id == params.user_id) ? currentUser.id : params.user_id;

        if (params.margin_per && params.margin_fix) {
            helper.sendErrorResponse(req, res, 'You can not set both type margin at same time.');
        }
        else if (params.margin_per > 100) {
            helper.sendErrorResponse(req, res, 'You can not set margin more then 100%');
        }
        else {

            let query = `UPDATE users SET margin_per='${params.margin_per}', margin_fix='${params.margin_fix}', is_betting=${params.is_betting}, status=${params.status}, updated_at='${helper.getCurrentDate()}' WHERE id=${user_id}`;
            c.log('query:', query);
            req.connection.query(query, function (err, results) {

                if (err) {
                    helper.sendErrorResponse(req, res, err);
                } else {

                    let result = {
                        status: true,
                        message: 'Account settings updated successfully.',
                    }
                    helper.sendResponse(req, res, result);
                }
            });
        }
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.list_sub_admin_wise_masters = function (req, res, next) {

    try {
        let params = req.params;

        req.connection.query(`SELECT id, name FROM users WHERE role='Sub-Admin' AND id=${params.parent_id} AND deleted_at IS NULL`, function (err, sub_admin, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            }
            else if(!sub_admin.length) {
                helper.sendErrorResponse(req, res, 'Sub Admin Account not found.');
            } 
            else {

                req.connection.query(`SELECT * FROM users WHERE role='Master' AND parent_id=${params.parent_id} AND deleted_at IS NULL`, function (err, results, fields) {

                    if (err) {
                        helper.sendErrorResponse(req, res, err);
                    } else {

                        let rows = [];
                        async.forEach(results, (rowInfo) => {
                            rows.push({
                                id: rowInfo.id,
                                parent_id: rowInfo.parent_id,
                                role: rowInfo.role,
                                name: rowInfo.name,
                                username: rowInfo.username,
                                credit: rowInfo.credit,
                                margin_per: rowInfo.margin_per,
                                margin_fix: rowInfo.margin_fix,
                                email: rowInfo.email,
                                mobile: rowInfo.mobile,
                                address: rowInfo.address,
                                status: rowInfo.status,
                            });
                        });

                        let result = {
                            status: true,
                            message: 'List Sub Admin Wise Masters.',
                            data: rows,
                            sub_admin: sub_admin[0],
                        }
                        helper.sendResponse(req, res, result);
                    }
                });
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}

exports.list_master_wise_players = function (req, res, next) {

    let params = req.params;
    let internalData = {};

    async.series([
        function (do_callback) {
            let query = `SELECT id, parent_id, name FROM users WHERE role='Master' AND id = ${params.parent_id}`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Master Account not found.');
                }
                else {
                    internalData.master = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {
            if (currentUser.role == 'Admin') {
                do_callback();
            }
            else if(internalData.master.parent_id == currentUser.id) {
                do_callback();
            }
            else {
                do_callback('You are not eligible to access this section.');
            }
        },
        function (do_callback) {
            let query = `SELECT id, name FROM users WHERE role='Sub-Admin' AND id = ${internalData.master.parent_id}`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Sub Admin Account not found.');
                }
                else {
                    internalData.sub_admin = results[0];
                    do_callback();
                }
            });
        },
        function (do_callback) {
            req.connection.query(`SELECT * FROM users WHERE role='Player' AND parent_id=${params.parent_id} AND deleted_at IS NULL`, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {
    
                    let rows = [];
                    async.forEach(results, (rowInfo) => {
                        rows.push({
                            id: rowInfo.id,
                            parent_id: rowInfo.parent_id,
                            role: rowInfo.role,
                            name: rowInfo.name,
                            username: rowInfo.username,
                            credit: rowInfo.credit,
                            email: rowInfo.email,
                            mobile: rowInfo.mobile,
                            address: rowInfo.address,
                            status: rowInfo.status,
                            is_betting: rowInfo.is_betting,
                        });
                    });
    
                    internalData.data = rows;
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
                message: 'List Master Wise Players.',
                data: internalData.data,
                master: internalData.master,
                sub_admin: internalData.sub_admin,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.update_stakes = function (req, res, next) {

    try {
        let params = req.body;
        
        let data = {
            stakes: JSON.stringify(params.stakes),
            updated_at: helper.getCurrentDate(),
        }
        req.connection.query(`UPDATE users SET ? WHERE id=${currentUser.id}`, data, function (err, results) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let result = {
                    status: true,
                    message: 'Stakes updated successfully.',
                }
                helper.sendResponse(req, res, result);
            }
        });
    }
    catch (err) {
        helper.sendErrorResponse(req, res, err);
    }
}
