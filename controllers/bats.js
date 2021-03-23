
exports.save = function (req, res, next) {

    let params = req.body;
    let internalData = {};

    async.series([
        function (do_callback) {

            // check the user account batting status
            if(!currentUser.is_betting) {
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
                else if(!results[0].is_bat_allowed) {
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
                else if(results.length) {
                    internalData.marketsAndMarketOdds = results;
                    do_callback();
                }
                else {
                    do_callback('Match is no more available.');
                }
            });
        },
        function (do_callback) {

            // set bat on session
            if(params.bat_type == 'session') {

                let query = `SELECT * FROM match_sessions WHERE event_id=${params.event_id} AND SelectionId=${params.electionId}`;
                req.connection.query(query, function (err, results, fields) {
    
                    if (err) {
                        do_callback(err);
                    }
                    else if(results[0].length) {
                        internalData.marketsAndMarketOdds = results;
                        do_callback();
                    }
                    else {
    
                        internalData.marketsAndMarketOdds = results;
                        do_callback();
                    }
                });

            } else {
                do_callback();
            }
        },
        function (do_callback) {

            let marketIDs = [];
            internalData.marketsAndMarketOdds.forEach(element => {
                marketIDs.push(element.marketId);
            });

            internalData.marketIDs = marketIDs.join();
            do_callback();
        },
        function (do_callback) {

            // get markets & odds as per market
            let query = `SELECT id, marketId, selectionId, runnerName FROM market_runners WHERE marketId IN (${internalData.marketIDs})`;

            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.market_runners = results;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get market runners & odds as per runner
            let query = `SELECT * FROM market_odd_runners WHERE marketId IN (${internalData.marketIDs})`;

            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.market_odd_runners = results;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            // get team name
            if(internalData.market_runners.length > 0) {
                internalData.homeTeamName = internalData.market_runners[0].runnerName;
                internalData.awayTeamName = internalData.market_runners[1].runnerName;
            }

            let markets = [];
            let singleRow = {};
            let innerCount = -1;
            async.forEach(internalData.marketsAndMarketOdds, (singleMarketsAndMarketOdds) => {

                // add market and market odds
                singleRow = {
                    event_id: singleMarketsAndMarketOdds.event_id,
                    marketId: singleMarketsAndMarketOdds.marketId,
                    marketName: singleMarketsAndMarketOdds.marketName,
                    marketOddStatus: singleMarketsAndMarketOdds.status,
                    inplay: singleMarketsAndMarketOdds.inplay,
                    runners: [],
                };

                internalData.market_runners.forEach(singleMarketRunner => {

                    if(singleMarketRunner.marketId == singleMarketsAndMarketOdds.marketId) {

                        innerCount++;

                        // get market runners odd 
                        let singleMarketOddRunner = internalData.market_odd_runners[innerCount];

                        // add market runners 
                        let data = {
                            market_runner_id: singleMarketRunner.id,
                            selectionId: singleMarketRunner.selectionId,
                            runnerName: singleMarketRunner.runnerName,
                            prices: [
                                {
                                    price: singleMarketOddRunner.availableToBack_price_1,
                                    size: singleMarketOddRunner.availableToBack_size_1,
                                },
                                {
                                    price: singleMarketOddRunner.availableToBack_price_2,
                                    size: singleMarketOddRunner.availableToBack_size_2,
                                },
                                {
                                    price: singleMarketOddRunner.availableToBack_price_3,
                                    size: singleMarketOddRunner.availableToBack_size_3,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_3,
                                    size: singleMarketOddRunner.availableToLay_size_3,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_2,
                                    size: singleMarketOddRunner.availableToLay_size_2,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_1,
                                    size: singleMarketOddRunner.availableToLay_size_1,
                                }
                            ]
                        }
                        singleRow.runners.push(data)
                    }
                });

                markets.push(singleRow);

            });

            internalData.markets = markets;
            do_callback();

        },
        function (do_callback) {

            // get sessions 
            let query = `SELECT id session_id, event_id, RunnerName, LayPrice1, LaySize1, BackPrice1, BackSize1, GameStatus
                FROM match_sessions 
                WHERE event_id=${params.event_id} AND is_allowed=1 AND is_result=0 AND is_abandoned=0`;

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

            // get score
            let query = `SELECT * FROM match_scores WHERE event_id=${params.event_id}`;

            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (results.length > 0) {
                    let score = JSON.parse(results[0].score);
                    score.home.name = internalData.homeTeamName;
                    score.away.name = internalData.awayTeamName;
                    internalData.score = score;

                    internalData.eventTypeId = results[0].eventTypeId;
                    internalData.matchType = (results[0].matchType) ? 'LIMITED_OVER' : null;
                    do_callback();
                }
                else {
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
                message: 'User Match Odds',
                eventTypeId: internalData.eventTypeId,
                matchType: internalData.matchType,
                score: internalData.score,
                markets: internalData.markets,
                sessions: internalData.sessions,
            }
            helper.sendResponse(req, res, result);
        }
    });
}

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
