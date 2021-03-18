
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

        let query = `SELECT Matche.event_id, MarketOdd.inplay, Matche.event_name, MOR.availableToBack_price_1, MOR.availableToLay_price_1 FROM market_odds MarketOdd 
        JOIN markets Market ON MarketOdd.marketId = Market.marketId 
        JOIN matches Matche ON Market.match_id = Matche.id
        RIGHT JOIN market_odd_runners MOR ON MOR.market_odd_id = MarketOdd.id
        WHERE MarketOdd.inplay=1 AND MarketOdd.status='OPEN' AND Market.marketName='Match Odds'`;

        req.connection.query(query, function (err, results, fields) {

            if (err) {
                helper.sendErrorResponse(req, res, err);
            } else {

                let count = -1;
                let rows = [];
                let lastEventID = null;
                async.forEach(results, (rowInfo) => {

                    if(lastEventID != rowInfo.event_id) {
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
