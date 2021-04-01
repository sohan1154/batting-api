var db = require('../config/DbConnection');
exports.listing = function (req, res, next) {

    try {
        let params = req.query;

        let andWhere = (typeof params.seriesID !== 'undefined') ? `AND Matches.series_id=${params.seriesID}` : '';

        req.connection.query(`SELECT Matches.*, Series.competition_name, Sports.sports_name FROM matches Matches JOIN series Series ON Matches.series_id = Series.id JOIN sports Sports ON Series.sports_id = Sports.id WHERE Matches.deleted_at IS NULL ${andWhere}`, function (err, results, fields) {

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
                        event_open_date: helper.getFormatedDate(rowInfo.event_open_date, 'YYYY-MM-DD hh:mm A'),
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

exports.in_play = function (req, res, next) {

    try {
        let params = req.query;

        // need to create a view for this query
        let query = `SELECT 
        Sports.id, Matche.event_id, MarketOdd.inplay, Matche.event_name, MOR.availableToBack_price_1, MOR.availableToLay_price_1 
        FROM market_odds MarketOdd 
        JOIN markets Market ON MarketOdd.marketId = Market.marketId 
        JOIN matches Matche ON Market.match_id = Matche.id
        JOIN series Series ON Matche.series_id = Series.id
        JOIN sports Sports ON Series.sports_id = Sports.id
        RIGHT JOIN market_odd_runners MOR ON MOR.market_odd_id = MarketOdd.id
        WHERE 
        MarketOdd.inplay=1 AND MarketOdd.status='OPEN' 
        AND Market.marketName='Match Odds' 
        AND Matche.match_result=0 AND Matche.is_abandoned=0 AND Matche.status=1 AND Matche.deleted_at IS NULL
        AND Series.status=1 AND Series.deleted_at IS NULL
        AND Sports.status=1 AND Sports.deleted_at IS NULL`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let count = -1;
                let rows = [];
                let lastEventID = null;
                async.forEach(results, (rowInfo) => {

                    if (lastEventID != rowInfo.event_id) {
                        rows.push({
                            sports_id: rowInfo.id,
                            event_id: rowInfo.event_id,
                            event_name: rowInfo.event_name,
                            event_open_date: helper.getFormatedDate(rowInfo.event_open_date, 'YYYY-MM-DD hh:mm A'),
                            inplay: rowInfo.inplay,
                            prices: [
                                rowInfo.availableToBack_price_1,
                                rowInfo.availableToLay_price_1,
                            ]
                        });
                        count++;
                    } else {
                        rows[count].prices.push(rowInfo.availableToBack_price_1);
                        rows[count].prices.push(rowInfo.availableToLay_price_1);
                    }

                    lastEventID = rowInfo.event_id;
                });

                let result = {
                    status: true,
                    message: 'In-play matches.',
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

exports.UserMatchOdds_old = function (req, res, next) {

    let params = req.params;
    let internalData = {
        eventTypeId: '',
        matchType: '',
        marketIDs: '',
        homeTeamName: '',
        awayTeamName: '',
        score: [],
        markets: [],
        sessions: [],
        stakes: [],
    };

    async.series([

        function (do_callback) {

            // get markets & odds as per market
            let query = `SELECT Market.id market_id, Market.marketId, Market.event_id, Market.marketName,
                MarketOdd.id market_odd_id, MarketOdd.status, MarketOdd.inplay
                FROM markets Market 
                JOIN market_odds MarketOdd ON MarketOdd.marketId = Market.marketId
                WHERE Market.event_id=${params.event_id}`;

            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.marketsAndMarketOdds = results;
                    do_callback();
                }
            });
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
            if (internalData.market_runners.length > 0) {
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

                    if (singleMarketRunner.marketId == singleMarketsAndMarketOdds.marketId) {

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
                                    price: singleMarketOddRunner.availableToBack_price_3,
                                    size: singleMarketOddRunner.availableToBack_size_3,
                                },
                                {
                                    price: singleMarketOddRunner.availableToBack_price_2,
                                    size: singleMarketOddRunner.availableToBack_size_2,
                                },
                                {
                                    price: singleMarketOddRunner.availableToBack_price_1,
                                    size: singleMarketOddRunner.availableToBack_size_1,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_1,
                                    size: singleMarketOddRunner.availableToLay_size_1,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_2,
                                    size: singleMarketOddRunner.availableToLay_size_2,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_3,
                                    size: singleMarketOddRunner.availableToLay_size_3,
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
            let query = `SELECT id session_id, event_id, RunnerName, LayPrice1, LaySize1, BackPrice1, BackSize1, GameStatus, SelectionId
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

exports.UserMatchOdds = function (eventID, callback) {

    let internalData = {
        eventTypeId: '',
        matchType: '',
        marketIDs: '',
        homeTeamName: '',
        awayTeamName: '',
        score: [],
        markets: [],
        sessions: [],
        stakes: [],
    };

    async.series([

        function (do_callback) {

            // get markets & odds as per market
            let query5 = `SELECT Market.id market_id, Market.marketId, Market.event_id, Market.marketName,
                MarketOdd.id market_odd_id, MarketOdd.status, MarketOdd.inplay
                FROM markets Market 
                JOIN market_odds MarketOdd ON MarketOdd.marketId = Market.marketId
                WHERE Market.event_id=${eventID}`;

            db.query(query5, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                } else {

                    internalData.marketsAndMarketOdds = results;
                    do_callback();
                }
            });
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
            let query4 = `SELECT id, marketId, selectionId, runnerName FROM market_runners WHERE marketId IN (${internalData.marketIDs})`;

            db.query(query4, function (err, results, fields) {

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
            let query3 = `SELECT * FROM market_odd_runners WHERE marketId IN (${internalData.marketIDs})`;

            db.query(query3, function (err, results, fields) {

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
            if (internalData.market_runners.length > 0) {
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

                    if (singleMarketRunner.marketId == singleMarketsAndMarketOdds.marketId) {

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
                                    price: singleMarketOddRunner.availableToBack_price_3,
                                    size: singleMarketOddRunner.availableToBack_size_3,
                                },
                                {
                                    price: singleMarketOddRunner.availableToBack_price_2,
                                    size: singleMarketOddRunner.availableToBack_size_2,
                                },
                                {
                                    price: singleMarketOddRunner.availableToBack_price_1,
                                    size: singleMarketOddRunner.availableToBack_size_1,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_1,
                                    size: singleMarketOddRunner.availableToLay_size_1,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_2,
                                    size: singleMarketOddRunner.availableToLay_size_2,
                                },
                                {
                                    price: singleMarketOddRunner.availableToLay_price_3,
                                    size: singleMarketOddRunner.availableToLay_size_3,
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
            let query2 = `SELECT id session_id, event_id, RunnerName, LayPrice1, LaySize1, BackPrice1, BackSize1, GameStatus, SelectionId
                FROM match_sessions 
                WHERE event_id=${eventID} AND is_allowed=1 AND is_result=0 AND is_abandoned=0`;

            db.query(query2, function (err, results, fields) {

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
            let query1 = `SELECT * FROM match_scores WHERE event_id=${eventID}`;

            db.query(query1, function (err, results, fields) {

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
            callback(err, null);
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
            callback(result, null);
        }
    });



}

