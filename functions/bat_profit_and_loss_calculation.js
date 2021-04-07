
exports.calculateUserMatchScore = function (req, event_id, marketId, batSelectionId, main_callback) {

    let internalData = {
        marketProfitLossRunnerWise: {},
        sectionWiseBats: {
            odd: [],
        },
    };

    async.series([
        function (do_callback) {

            // get bats
            let query = `SELECT id, marketId, selectionId, market_runner_id, market_odd_id, match_session_id, session_run, 
                session_size, betfair_amount, stack, profit_loss, bat_type, is_back
                FROM user_bats 
                WHERE user_id=${currentUser.id} AND event_id=${event_id} AND marketId=${marketId} AND is_result=0 AND deleted_at IS NULL
                ORDER BY selectionId DESC`;
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
            let query = `SELECT id, marketId, selectionId, runnerName FROM market_runners 
                WHERE event_id=${event_id} AND marketId=${marketId}`;
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

            // divide bats into odds 

            let count_odd = 0;
            let selectionId = 0;
            async.forEachOf(internalData.bats, (rowInfo, key, callback) => {

                if (selectionId != rowInfo.selectionId) {

                    internalData.sectionWiseBats[rowInfo.bat_type].push([]);
                    internalData.sectionWiseBats[rowInfo.bat_type][count_odd].push(rowInfo);

                    count_odd++;

                    callback();
                } else {

                    internalData.sectionWiseBats[rowInfo.bat_type][count_odd - 1].push(rowInfo);
                    
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

            // calculate profit & loss market runner wise
            async.forEachOf(internalData.marketRunners, (singleMarketRunner, key, callback) => {

                let profit_loss = 0;
                async.forEachOf(internalData.sectionWiseBats.odd, (bats, key, callback_1) => {

                    async.forEachOf(bats, (innerSingleBat, key, callback_2) => {

                        if (innerSingleBat.marketId == singleMarketRunner.marketId) {

                            if (innerSingleBat.market_runner_id == singleMarketRunner.id) {

                                if (innerSingleBat.is_back) {

                                    profit_loss = (profit_loss + innerSingleBat.profit_loss);
                                } else {
                                    profit_loss = (profit_loss - innerSingleBat.stack);
                                }
                            } else {
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
        },
    ], function (err) {
        if (err) {
            main_callback(err);
        } else {

            let result = {
                status: true,
                message: 'User match score',
                user_available_credit: credit,
                // odd: internalData.sectionWiseBats.odd,
                market_wise_profit_loss_info: internalData.marketProfitLossRunnerWise,
            }
            main_callback(null, result);
        }
    });
}

exports.updateUserCredit = (req, credit, callback) => {

    let query = `UPDATE users SET credit=${credit}, updated_at='${helper.getCurrentDate()}' WHERE id=${currentUser.id}`;
    req.connection.query(query, function (err, results) {

        if (err) {
            callback(err);
        } else {
            callback(null)
        }
    });
}
