
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
        Matche.event_id, MarketOdd.inplay, Matche.event_name, MOR.availableToBack_price_1, MOR.availableToLay_price_1 
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
                            event_id: rowInfo.event_id,
                            event_name: rowInfo.event_name,
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

exports.UserMatchOdds = function (req, res, next) {

    let params = req.body;
    let internalData = {};

    async.series([
        function (do_callback) {

            // need to create a view for this query
            let query = `SELECT 
                Matche.event_id, MarketOdd.inplay, Matche.event_name, MOR.* 
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
                    do_callback(err);
                } else {

                    let odds = [];
                    async.forEach(results, (rowInfo) => {

                        odds.push({
                            event_id: rowInfo.event_id,
                            event_name: rowInfo.event_name,
                            inplay: rowInfo.inplay,
                            prices: [
                                {
                                    price: rowInfo.availableToBack_price_1,
                                    size: rowInfo.availableToBack_size_1,
                                },
                                {
                                    price: rowInfo.availableToBack_price_2,
                                    size: rowInfo.availableToBack_size_2,
                                },
                                {
                                    price: rowInfo.availableToBack_price_3,
                                    size: rowInfo.availableToBack_size_3,
                                },
                                {
                                    price: rowInfo.availableToLay_price_3,
                                    size: rowInfo.availableToLay_size_3,
                                },
                                {
                                    price: rowInfo.availableToLay_price_2,
                                    size: rowInfo.availableToLay_size_2,
                                },
                                {
                                    price: rowInfo.availableToLay_price_1,
                                    size: rowInfo.availableToLay_size_1,
                                }
                            ]
                        });
                    });

                    internalData.odds = odds;
                    do_callback();
                }
            });
        },
        function (do_callback) {

            internalData.stakes = [100, 200, 500, 1000, 2000, 5000];
            do_callback();
        },
    ], function (err) {
        if (err) {
            helper.sendErrorResponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'User Match Odds',
                score: internalData.score,
                odds: internalData.odds,
                toss: internalData.toss,
                sessions: internalData.sessions,
                stakes: internalData.stakes,
            }
            helper.sendResponse(req, res, result);
        }
    });
}
