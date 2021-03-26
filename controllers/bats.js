
exports.save = function (req, res, next) {

    let params = req.body;
    let internalData = {
        message: ''
    };

    async.series([
        function (do_callback) {

            // check the user account batting status
            if (!currentUser.is_betting) {
                do_callback('Yor batting is locaked, Please contact to Admin.');
            }
            else {
                do_callback();
            }
        },
        function (do_callback) {

            // get global settings 
            let query = `SELECT * FROM settings`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results[0].is_bat_allowed) {
                    do_callback('Currently batting is locaked for the system, Please contact to Admin.');
                }
                else {
                    internalData.settings = results;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get match info and check match, series & sports status
            let query = `SELECT Matche.id FROM matches Matche 
                JOIN series Series ON Matche.series_id = Series.id
                JOIN sports Sports ON Series.sports_id = Sports.id
                WHERE 
                Matche.event_id=${params.event_id} AND Matche.match_result=0 
                AND Matche.is_abandoned=0 AND Matche.status=1 AND Matche.deleted_at IS NULL
                AND Series.status=1 AND Series.deleted_at IS NULL
                AND Sports.status=1 AND Sports.deleted_at IS NULL`;

            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (results.length) {
                    // internalData.matchInfo = results[0];
                    do_callback();
                }
                else {
                    do_callback('Match is no more available.');
                }
            });
        },
        function (do_callback) {

            // get session info 
            if (params.bat_type == 'session') {

                let query = `SELECT * FROM match_sessions 
                    WHERE is_allowed=1 AND is_result=0 AND is_abandoned=0
                    AND event_id=${params.event_id} AND SelectionId=${params.selectionId}`;
                console.log('query:', query)
                req.connection.query(query, function (err, results, fields) {

                    if (err) {
                        do_callback(err);
                    }
                    else if (!results.length) {
                        do_callback('Session is no more available.');
                    }
                    else if (results[0].GameStatus) {
                        do_callback('Session ' + results[0].GameStatus);
                    }
                    else {
                        internalData.sessionInfo = results[0];
                        do_callback();
                    }
                });

            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // calculate bat profit or loss 
            if (params.bat_type == 'session') {

                if (params.is_back) {
                    internalData.session_run = internalData.sessionInfo.BackPrice1;
                    internalData.session_size = internalData.sessionInfo.BackSize1;

                    internalData.profit_loss = internalData.session_size;
                } else {
                    internalData.session_run = internalData.sessionInfo.LayPrice1;
                    internalData.session_size = internalData.sessionInfo.LaySize1;

                    internalData.profit_loss = internalData.session_size;
                }

                do_callback();
            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // save session bat
            if (params.bat_type == 'session') {

                let data = {
                    id: helper.getCurrentTimestamp() + '' + currentUser.id,
                    user_id: currentUser.id,
                    event_id: params.event_id,
                    selectionId: params.selectionId,
                    match_session_id: internalData.sessionInfo.id,
                    session_size: internalData.session_size,
                    session_run: internalData.session_run,
                    stack: params.stack,
                    profit_loss: internalData.profit_loss,
                    bat_type: 'session',
                    is_back: params.is_back,
                    created_at: helper.getCurrentDate(),
                }
                req.connection.query('INSERT INTO user_bats SET ?', data, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {
                        internalData.message = 'Session bat placed successfully.'
                        do_callback();
                    }
                });

            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // get odds info 
            if (params.bat_type == 'odd') {

                let query = `SELECT MarketOdd.id market_odd_id, MOR.availableToBack_price_1, MOR.availableToLay_price_1
                    FROM market_odd_runners MOR
                    JOIN market_odds MarketOdd ON MarketOdd.marketId = MOR.marketId
                    WHERE MOR.marketId=${params.marketId} AND MOR.selectionId=${params.selectionId}`;
                req.connection.query(query, function (err, results, fields) {

                    if (err) {
                        do_callback(err);
                    }
                    else if (!results.length) {
                        do_callback('Market is no more available.');
                    }
                    else {
                        internalData.marketInfo = results[0];
                        do_callback();
                    }
                });

            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // calculate bat profit or loss 
            if (params.bat_type == 'odd') {

                if (params.is_back) {
                    internalData.betfair_amount = internalData.marketInfo.availableToBack_price_1;

                    internalData.profit_loss = ((internalData.betfair_amount - 1) * 100);
                } else {
                    internalData.betfair_amount = internalData.marketInfo.availableToLay_price_1;

                    internalData.profit_loss = ((internalData.betfair_amount - 1) * 100);
                }

                do_callback();
            } else {
                do_callback();
            }
        },
        function (do_callback) {

            // save odd bat
            if (params.bat_type == 'odd') {
                let data = {
                    id: helper.getCurrentTimestamp() + '' + currentUser.id,
                    user_id: currentUser.id,
                    event_id: params.event_id,
                    marketId: params.marketId,
                    selectionId: params.selectionId,
                    market_runner_id: params.market_runner_id,
                    market_odd_id: internalData.marketInfo.market_odd_id,
                    betfair_amount: internalData.betfair_amount,
                    stack: params.stack,
                    profit_loss: internalData.profit_loss,
                    bat_type: 'odd',
                    is_back: params.is_back,
                    created_at: helper.getCurrentDate(),
                }
                req.connection.query('INSERT INTO user_bats SET ?', data, function (err, results) {

                    if (err) {
                        do_callback(err);
                    } else {
                        internalData.message = 'Market bat placed successfully.'
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
                message: internalData.message,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.UserMatchBats = function (req, res, next) {

    try {
        let params = req.params;

        let query = `SELECT UserBat.*, MatchSession.RunnerName, MarketRunner.runnerName FROM user_bats UserBat
            LEFT JOIN match_sessions MatchSession ON UserBat.match_session_id = MatchSession.id
            LEFT JOIN market_runners MarketRunner ON UserBat.market_runner_id = MarketRunner.id
            WHERE 
            UserBat.user_id=${currentUser.id} AND UserBat.event_id=${params.event_id} 
            AND UserBat.is_result=0 AND UserBat.deleted_at IS NULL`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let odds = [];
                let sessions = [];
                async.forEach(results, (rowInfo) => {

                    let data = {};
                    if (rowInfo.bat_type == "session") {

                        data = {
                            bat_id: rowInfo.id,
                            session_run: rowInfo.session_run,
                            session_size: rowInfo.session_size,
                            stack: rowInfo.stack,
                            runnerName: rowInfo.RunnerName,
                            profit_loss: rowInfo.profit_loss,
                            is_back: rowInfo.is_back,
                            getFormatedDate: helper.getFormatedDate(rowInfo.created_at),
                        };

                        sessions.push(data);
                    } else {

                        data = {
                            bat_id: rowInfo.id,
                            odds: rowInfo.betfair_amount,
                            stack: rowInfo.stack,
                            runnerName: rowInfo.runnerName,
                            profit_loss: rowInfo.profit_loss,
                            is_back: rowInfo.is_back,
                            getFormatedDate: helper.getFormatedDate(rowInfo.created_at),
                        };

                        odds.push(data);
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

exports.getUserMatchScore = function (req, res, next) {

    let params = req.params;
    let internalData = {
        // session_wise_profit_loss_info: [],
        sessionWiseProfitLossInfo: {},
        marketProfitLossRunnerWise: {},
        sectionWiseBats: {
            odd: [],
            session: [],
        },
    };

    async.series([
        function (do_callback) {

            // get bats
            let query = `SELECT id, marketId, selectionId, market_runner_id, market_odd_id, match_session_id, session_run, 
                session_size, betfair_amount, stack, profit_loss, bat_type, is_back
                FROM user_bats 
                WHERE user_id=${currentUser.id} AND event_id=${params.event_id} AND is_result=0 AND deleted_at IS NULL
                ORDER BY selectionId DESC, marketId ASC`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.bats = results;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get market runners
            let query = `SELECT id, marketId, selectionId, runnerName FROM market_runners WHERE event_id=${params.event_id}`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.marketRunners = results;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // divide bats into sessions & odds 

            let count_odd = 0;
            let count_session = 0;
            let selectionId = 0;
            async.forEachOf(internalData.bats, (rowInfo, key, callback) => {

                if (selectionId != rowInfo.selectionId) {

                    if (rowInfo.bat_type == "session") {

                        internalData.sectionWiseBats[rowInfo.bat_type].push([]);
                        internalData.sectionWiseBats[rowInfo.bat_type][count_session].push(rowInfo);

                        count_session++;
                    } else {

                        internalData.sectionWiseBats[rowInfo.bat_type].push([]);
                        internalData.sectionWiseBats[rowInfo.bat_type][count_odd].push(rowInfo);

                        count_odd++;
                    }

                    callback();
                } else {

                    if (rowInfo.bat_type == "session") {

                        internalData.sectionWiseBats[rowInfo.bat_type][count_session - 1].push(rowInfo);
                    } else {

                        internalData.sectionWiseBats[rowInfo.bat_type][count_odd - 1].push(rowInfo);
                    }
                    callback();
                }

                selectionId = rowInfo.selectionId;
            }, err => {
                if (err) {
                    do_callback(err);
                } else {
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // sort the session bats data
            async.forEachOf(internalData.sectionWiseBats.session, (bats, key, callback) => {

                bats.sort((a, b) => {
                    if (a.session_run < b.session_run) { return -1; }
                    if (a.session_run > b.session_run) { return 1; }

                    // else names must be equal
                    return 0;
                });

                callback();
            }, err => {
                if (err) {
                    do_callback(err);
                } else {
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // generate the session blocks as per possible conditions

            let count = 0;
            let min_run = 0;
            let table_index = '';
            let max_exposure = 0;
            let batTable = [];
            async.forEachOf(internalData.sectionWiseBats.session, (bats, key, callback) => {

                async.forEachOf(bats, (outerSingleBat, key, callback_1) => {

                    count++;

                    if (bats.length > count) {
                        table_index = min_run + '-' + (outerSingleBat.session_run - 1);
                    } else {
                        table_index = min_run + '+';
                    }
                    min_run = outerSingleBat.session_run;

                    let profit_loss = 0;

                    // calculate the profit or loss by block wise 
                    async.forEachOf(bats, (innerSingleBat, key, callback_2) => {

                        if (innerSingleBat.is_back) {

                            if (table_index.indexOf('+') != -1) {

                                if (outerSingleBat.session_run >= innerSingleBat.session_run) {
                                    profit_loss = (profit_loss + innerSingleBat.profit_loss);
                                } else {
                                    profit_loss = (profit_loss - innerSingleBat.stack);
                                }
                            } else {
                                if (outerSingleBat.session_run <= innerSingleBat.session_run) {
                                    profit_loss = (profit_loss - innerSingleBat.stack);
                                } else {
                                    profit_loss = (profit_loss + innerSingleBat.profit_loss);
                                }
                            }
                        } else {
                            if (outerSingleBat.session_run <= innerSingleBat.session_run) {
                                profit_loss = (profit_loss + innerSingleBat.profit_loss);
                            } else {
                                profit_loss = (profit_loss - innerSingleBat.stack);
                            }
                        }

                        callback_2();
                    }, err => {
                        if (err) {
                            callback_1(err);
                        } else {

                            // calculate max exposure
                            max_exposure = (profit_loss < max_exposure) ? profit_loss : max_exposure;

                            batTable.push([table_index, profit_loss]);
                            callback_1();
                        }
                    });

                }, err => {
                    if (err) {
                        callback(err);
                    } else {

                        // internalData.session_wise_profit_loss_info.push({
                        //     bat_id: bats[0].id,
                        //     match_session_id: bats[0].match_session_id,
                        //     selectionId: bats[0].selectionId,
                        //     max_exposure: max_exposure,
                        //     bats: batTable
                        // })

                        internalData.sessionWiseProfitLossInfo[bats[0].match_session_id] = {
                            bat_id: bats[0].id,
                            match_session_id: bats[0].match_session_id,
                            selectionId: bats[0].selectionId,
                            max_exposure: max_exposure,
                            bats: batTable
                        }

                        callback();
                    }
                });
            }, err => {
                if (err) {
                    do_callback(err);
                } else {
                    do_callback();
                }
            });
        },
        function (do_callback) {

            async.forEachOf(internalData.marketRunners, (singleMarketRunner, key, callback) => {

                let profit_loss = 0;
                // calculate market wise profit loss information
                // console.log('======================================')
                async.forEachOf(internalData.sectionWiseBats.odd, (bats, key, callback_1) => {

                    async.forEachOf(bats, (innerSingleBat, key, callback_2) => {

                        if (innerSingleBat.marketId == singleMarketRunner.marketId) {
                            // console.log('--------------', singleMarketRunner.marketId)

                            if(innerSingleBat.market_runner_id == singleMarketRunner.id) {
                                // console.log('YES:::::::', singleMarketRunner.id, ':::is_back:::', innerSingleBat.is_back)

                                if (innerSingleBat.is_back) {

                                    profit_loss = (profit_loss + innerSingleBat.profit_loss);
                                } else {
                                    profit_loss = (profit_loss - innerSingleBat.stack);
                                }
                            } else {
                                // console.log('NO:::::::', singleMarketRunner.id, ':::is_back:::', innerSingleBat.is_back)
                                if (innerSingleBat.is_back) {

                                    profit_loss = (profit_loss - innerSingleBat.stack);
                                } else {
                                    profit_loss = (profit_loss + innerSingleBat.profit_loss);
                                }
                            }
                        }

                        callback_2();
                    }, err => {
                        if (err) {
                            callback_1(err);
                        } else {

                            callback_1();
                        }
                    });
                }, err => {
                    if (err) {
                        callback(err);
                    } else {
                        
                        internalData.marketProfitLossRunnerWise[singleMarketRunner.id] = {
                            market_runner_id: singleMarketRunner.id,
                            marketId: singleMarketRunner.marketId,
                            selectionId: singleMarketRunner.selectionId,
                            runnerName: singleMarketRunner.runnerName,
                            profit_loss: profit_loss,
                            is_profit: (profit_loss > 0) ? 1 : 0,
                        };
                        callback();
                    }
                });

            }, err => {
                if (err) {
                    do_callback(err);
                } else {
                    do_callback();
                }
            });
        }
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'User match score',
                // session: internalData.sectionWiseBats.session,
                // odd: internalData.sectionWiseBats.odd,
                user_available_credit: currentUser.credit,
                market_wise_profit_loss_info: internalData.marketProfitLossRunnerWise,
                // session_wise_profit_loss_info: internalData.session_wise_profit_loss_info,
                session_wise_profit_loss_info: internalData.sessionWiseProfitLossInfo,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

exports.delete = function (req, res, next) {

    let params = req.params;
    let internalData = {};

    async.series([
        function (do_callback) {

            // get user info and check the user is valid or not to delete the bat
            let query = `SELECT * FROM users WHERE id=${currentUser.id}`;

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
            let query = `UPDATE user_bats SET deleted_at='${helper.getCurrentDate()}', action_user_id=${currentUser.id} WHERE id=${params.id}`;
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
