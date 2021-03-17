var third_party_helper = require('../functions/third_party_helper');

// testing data for display not in real use
exports.getSports = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getSports()
            .then(response => {

                let result = {
                    status: true,
                    message: 'Sports.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getSeries = function (req, res, next) {

    try {
        let params = req.params;
        let sportsID = params.sportsID;

        third_party_helper.getSeries(sportsID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Series.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getMatches = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getMatches(params.sportsID, params.seriesID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Matches.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getMarkets = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getMarkets(params.eventID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Markets.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getMarketsSelection = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getMarketsSelection(params.marketID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Markets Selection.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getMarketOdds = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getMarketOdds(params.marketID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Market Odds.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getSessions = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getSession(params.matchID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Session.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}

exports.getScores = function (req, res, next) {
    try {
        let params = req.params;

        third_party_helper.getScore(params.matchID)
            .then(response => {

                let result = {
                    status: true,
                    message: 'Score.',
                    data: response
                }
                helper.sendResponse(req, res, result);

            }).catch(error => {
                helper.sendErrorResponse(req, res, error);
            });

    }
    catch (err) {
        //console.log('err::::::', err)
        helper.sendErrorResponse(req, res, err);
    }
}
// end testing data for display not in real use 

// api real use is start from here 
exports.updateSeries = function (req, res, next) {

    let internalData = {};

    async.series([
        function (do_callback) {
            let query = `SELECT id FROM sports WHERE status=1 AND deleted_at IS NULL`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Sports not found.');
                }
                else {

                    async.eachSeries(results, (singleSports, sports_callback) => {

                        //console.log('singleSports:::::', singleSports)

                        // get series from api and process the response data
                        third_party_helper.getSeries(singleSports.id)
                            .then(response => {

                                //console.log('response:::::', response)

                                if (typeof response !== 'undefined' && response.length > 0) {

                                    async.eachSeries(response, (singleSeries, series_callback) => {

                                        //console.log('singleSeries::::########:', singleSeries)
                                        // checking record into database
                                        let query = `SELECT id FROM series WHERE competition_id = ${singleSeries.competition.id}`;
                                        req.connection.query(query, function (err, results, fields) {

                                            if (err) {
                                                //console.log('error series finding into database:', err);
                                                series_callback();
                                            }
                                            else if (!results.length) {

                                                // save series into database if not found
                                                let data = {
                                                    sports_id: singleSports.id,
                                                    competition_id: singleSeries.competition.id,
                                                    competition_name: singleSeries.competition.name,
                                                    marketCount: singleSeries.marketCount,
                                                    competitionRegion: singleSeries.competitionRegion,
                                                    status: 1,
                                                    created_at: helper.getCurrentDate(),
                                                    updated_at: helper.getCurrentDate(),
                                                };

                                                req.connection.query('INSERT INTO series SET ?', data, function (err, results) {

                                                    if (err) {
                                                        //console.log('error series saving into database:', err);
                                                        series_callback();
                                                    } else {
                                                        //console.log('series saved successfully');
                                                        series_callback();
                                                    }
                                                });
                                            }
                                            else {
                                                series_callback();
                                            }
                                        });

                                    },
                                        function (err) {
                                            if (err) {
                                                sports_callback();
                                            } else {
                                                sports_callback();
                                            }
                                        });

                                } else {

                                    sports_callback();
                                }
                            })
                            .catch(error => {
                                sports_callback(error);
                            });
                    }, function (err) {
                        if (err) {
                            do_callback(err)
                        } else {
                            do_callback()
                        }
                    })
                }
            });
        },
    ], function (err) {
        if (err) {
            helper.endDatabaseConnectionAndSendReponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Series saved successfully.',
            }
            helper.endDatabaseConnectionAndSendReponse(req, res, result);
        }
    });
}

exports.updateMatches = function (req, res, next) {

    let internalData = {};

    async.series([
        function (do_callback) {
            let query = `SELECT id, sports_id, competition_id FROM series WHERE status=1 AND deleted_at IS NULL`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Series not found.');
                }
                else {

                    async.eachSeries(results, (singleSeries, series_callback) => {

                        //console.log('singleSeries:::::', singleSeries)

                        // get matches from api and process the response data
                        third_party_helper.getMatches(singleSeries.sports_id, singleSeries.competition_id)
                            .then(response => {

                                //console.log('response:::::', response)

                                if (typeof response !== 'undefined' && response.length > 0) {

                                    async.eachSeries(response, (singleMatch, match_callback) => {

                                        //console.log('singleMatch::::########:', singleMatch)

                                        // checking record into database
                                        let query = `SELECT id FROM matches WHERE event_id = ${singleMatch.event.id}`;
                                        req.connection.query(query, function (err, results, fields) {

                                            if (err) {
                                                //console.log('error matches finding into database:', err);
                                                match_callback();
                                            }
                                            else if (!results.length) {

                                                // save series into database if not found
                                                let data = {
                                                    series_id: singleSeries.id,
                                                    event_id: singleMatch.event.id,
                                                    event_name: singleMatch.event.name,
                                                    event_country_code: singleMatch.event.countryCode,
                                                    event_timezone: singleMatch.event.timezone,
                                                    event_open_date: helper.getFormatedDate(singleMatch.event.openDate),
                                                    market_count: singleMatch.marketCount,
                                                    scoreboard_id: singleMatch.scoreboard_id,
                                                    liability_type: singleMatch.liability_type,
                                                    undeclared_markets: singleMatch.undeclared_markets,
                                                    status: 1,
                                                    created_at: helper.getCurrentDate(),
                                                    updated_at: helper.getCurrentDate(),
                                                };

                                                req.connection.query('INSERT INTO matches SET ?', data, function (err, results) {

                                                    if (err) {
                                                        //console.log('error matches saving into database:', err);
                                                        match_callback();
                                                    } else {
                                                        //console.log('matches saved successfully');
                                                        match_callback();
                                                    }
                                                });
                                            }
                                            else {
                                                match_callback();
                                            }
                                        });

                                    },
                                        function (err) {
                                            if (err) {
                                                series_callback();
                                            } else {
                                                series_callback();
                                            }
                                        });

                                } else {

                                    series_callback();
                                }
                            })
                            .catch(error => {
                                series_callback(error);
                            });
                    }, function (err) {
                        if (err) {
                            do_callback(err)
                        } else {
                            do_callback()
                        }
                    })

                }
            });
        },
    ], function (err) {
        if (err) {
            helper.endDatabaseConnectionAndSendReponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Matches saved successfully.',
            }
            helper.endDatabaseConnectionAndSendReponse(req, res, result);
        }
    });
}

exports.updateMarkets = function (req, res, next) {

    let internalData = {};

    async.series([
        function (do_callback) {
            let query = `SELECT id, series_id, event_id FROM matches WHERE status=1 AND deleted_at IS NULL`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Matches not found.');
                }
                else {

                    async.eachSeries(results, (singleMatch, callback_1) => {

                        //console.log('singleMatch:::::', singleMatch)

                        // get matches from api and process the response data
                        third_party_helper.getMarkets(singleMatch.event_id)
                            .then(response => {

                                //console.log('response:::::', response)

                                if (typeof response !== 'undefined' && response.length > 0) {

                                    async.eachSeries(response, (singleMarket, callback_2) => {

                                        //console.log('singleMarket::::########:', singleMarket)

                                        // checking record into database
                                        let query = `SELECT id FROM markets WHERE match_id = ${singleMatch.id} AND marketId = ${singleMarket.marketId}`;
                                        req.connection.query(query, function (err, results, fields) {

                                            if (err) {
                                                //console.log('error market finding into database:', err);
                                                callback_2();
                                            }
                                            else if (!results.length) {

                                                // save record into database if not found
                                                let data = {
                                                    match_id: singleMatch.id,
                                                    marketId: singleMarket.marketId,
                                                    marketName: singleMarket.marketName,
                                                    marketStartTime: helper.getFormatedDate(singleMarket.marketStartTime),
                                                    totalMatched: singleMarket.marketId,
                                                    created_at: helper.getCurrentDate(),
                                                    updated_at: helper.getCurrentDate(),
                                                };

                                                req.connection.query('INSERT INTO markets SET ?', data, function (err, results) {

                                                    if (err) {
                                                        //console.log('error market saving into database:', err);
                                                        callback_2();
                                                    } else {
                                                        //console.log('market saved successfully, Saving market runners.');

                                                        let insertId = results.insertId;

                                                        if (typeof singleMarket.runners !== 'undefined' && singleMarket.runners.length > 0) {

                                                            async.eachSeries(singleMarket.runners, (singleRunner, callback_3) => {

                                                                //console.log('singleRunner::::########:', singleRunner)

                                                                let data = {
                                                                    market_id: insertId,
                                                                    match_id: singleMatch.id,
                                                                    selectionId: singleRunner.selectionId,
                                                                    runnerName: singleRunner.runnerName,
                                                                    handicap: singleRunner.handicap,
                                                                    sortPriority: singleRunner.sortPriority,
                                                                    created_at: helper.getCurrentDate(),
                                                                    updated_at: helper.getCurrentDate(),
                                                                };

                                                                req.connection.query('INSERT INTO market_runners SET ?', data, function (err, results) {

                                                                    if (err) {
                                                                        //console.log('error market runner saving into database:', err);
                                                                        callback_3();
                                                                    } else {
                                                                        //console.log('market runner saved successfully');

                                                                        callback_3();
                                                                    }
                                                                });
                                                            },
                                                                function (err) {
                                                                    if (err) {
                                                                        callback_2();
                                                                    } else {
                                                                        callback_2();
                                                                    }
                                                                });
                                                        }
                                                        else {
                                                            callback_2();
                                                        }
                                                    }
                                                });
                                            }
                                            else {
                                                callback_2();
                                            }
                                        });

                                    },
                                        function (err) {
                                            if (err) {
                                                callback_1();
                                            } else {
                                                callback_1();
                                            }
                                        });

                                } else {

                                    callback_1();
                                }
                            })
                            .catch(error => {
                                callback_1(error);
                            });

                    }, function (err) {
                        if (err) {
                            do_callback(err)
                        } else {
                            do_callback()
                        }
                    })

                }
            });
        },
    ], function (err) {
        if (err) {
            helper.endDatabaseConnectionAndSendReponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Markets saved successfully.',
            }
            helper.endDatabaseConnectionAndSendReponse(req, res, result);
        }
    });
}

exports.updateMarketOdds = function (req, res, next) {

    let internalData = {};
    let marketIDs = [];
    async.series([
        function (do_callback) {
            let query = `SELECT Market.marketId FROM markets Market 
            JOIN matches Matche ON Market.match_id = Matche.id 
            JOIN series Series ON Matche.series_id = Series.id 
            JOIN sports Sport ON Series.sports_id = Sport.id 
            WHERE ( 
                ( Matche.event_open_date BETWEEN DATE_SUB(NOW(), INTERVAL 5 DAY) AND NOW() AND Series.competition_name='Test Matches' AND Sport.status=1 AND Sport.deleted_at IS NULL AND Series.status=1 AND Series.deleted_at IS NULL AND Matche.match_result=0 AND Matche.status=1 AND Matche.deleted_at IS NULL ) 
                OR 
                ( DATE(Matche.event_open_date) = DATE(NOW()) AND Sport.status=1 AND Sport.deleted_at IS NULL AND Series.status=1 AND Series.deleted_at IS NULL AND Matche.match_result=0 AND Matche.status=1 AND Matche.deleted_at IS NULL )
            )`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Markets not found.');
                }
                else {

                    for (var i = 0; i < results.length / 25; i++) {
                        marketIDs[i] = new Array(2);
                    }

                    let bunchNo = 0;
                    let count = 0;
                    results.forEach(element => {

                        marketIDs[bunchNo].push(element.marketId);

                        count++;
                        if (count == 25) {
                            bunchNo++;
                            count = 0;
                        }
                    });
                    do_callback();
                }
            })
        },
        function (do_callback) {

            async.eachSeries(marketIDs, (singleIdsBunch, ids_callback) => {

                // get matches from api and process the response data
                third_party_helper.getMarketOdds(singleIdsBunch.toString())
                    .then(response => {

                        //console.log('response:::::', response)

                        if (typeof response !== 'undefined' && response.length > 0) {

                            async.eachSeries(response, (singleMarketOdds, callback_1) => {

                                //console.log('singleMarketOdds::::########:', singleMarketOdds)

                                // checking record into database
                                let query = `SELECT id FROM market_odds WHERE marketId = ${singleMarketOdds.marketId}`;
                                req.connection.query(query, function (err, results, fields) {

                                    if (err) {
                                        //console.log('error market odds finding into database:', err);
                                        callback_1();
                                    }
                                    else if (!results.length) {

                                        // save record into database if not found
                                        let data = {
                                            marketId: singleMarketOdds.marketId,
                                            isMarketDataDelayed: singleMarketOdds.isMarketDataDelayed,
                                            status: singleMarketOdds.status,
                                            inplay: singleMarketOdds.inplay,
                                            numberOfRunners: singleMarketOdds.numberOfRunners,
                                            numberOfActiveRunners: singleMarketOdds.numberOfActiveRunners,
                                            lastMatchTime: helper.getFormatedDate(singleMarketOdds.lastMatchTime),
                                            totalMatched: singleMarketOdds.totalMatched,
                                            updateTime: helper.getFormatedDate(singleMarketOdds.updateTime),
                                            created_at: helper.getCurrentDate(),
                                            updated_at: helper.getCurrentDate(),
                                        };

                                        req.connection.query('INSERT INTO market_odds SET ?', data, function (err, results) {

                                            if (err) {
                                                //console.log('error market odds saving into database:', err);
                                                callback_1();
                                            } else {
                                                //console.log('market odds saved successfully, Saving market odds runners.');

                                                let insertId = results.insertId;

                                                if (typeof singleMarketOdds.runners !== 'undefined' && singleMarketOdds.runners.length > 0) {

                                                    async.eachSeries(singleMarketOdds.runners, (singleRunner, callback_3) => {

                                                        //console.log('singleRunner::::########:', singleRunner)

                                                        let availableToBacks = singleRunner.ex.availableToBack;
                                                        let availableToLays = singleRunner.ex.availableToLay;

                                                        let data = {
                                                            market_odd_id: insertId,
                                                            marketId: singleMarketOdds.marketId,
                                                            selectionId: singleRunner.selectionId,
                                                            status: singleRunner.status,
                                                            totalMatched: singleRunner.totalMatched,

                                                            availableToBack_price_1: availableToBacks[0].price,
                                                            availableToBack_size_1: availableToBacks[0].size,
                                                            availableToBack_price_2: availableToBacks[0].price,
                                                            availableToBack_size_2: availableToBacks[0].size,
                                                            availableToBack_price_3: availableToBacks[0].price,
                                                            availableToBack_size_3: availableToBacks[0].size,

                                                            availableToBack_price_1: availableToLays[0].price,
                                                            availableToBack_size_1: availableToLays[0].size,
                                                            availableToBack_price_2: availableToLays[0].price,
                                                            availableToBack_size_2: availableToLays[0].size,
                                                            availableToBack_price_3: availableToLays[0].price,
                                                            availableToBack_size_3: availableToLays[0].size,

                                                            created_at: helper.getCurrentDate(),
                                                            updated_at: helper.getCurrentDate(),
                                                        };

                                                        req.connection.query('INSERT INTO market_odd_runners SET ?', data, function (err, results) {

                                                            if (err) {
                                                                //console.log('error market odds runner saving into database:', err);
                                                                callback_3();
                                                            } else {
                                                                //console.log('market odds runner saved successfully');

                                                                callback_3();
                                                            }
                                                        });
                                                    },
                                                        function (err) {
                                                            if (err) {
                                                                callback_1();
                                                            } else {
                                                                callback_1();
                                                            }
                                                        });
                                                }
                                                else {
                                                    callback_1();
                                                }
                                            }
                                        });
                                    }
                                    else {
                                        callback_1();
                                    }
                                });

                            },
                                function (err) {
                                    if (err) {
                                        ids_callback();
                                    } else {
                                        ids_callback();
                                    }
                                });

                        } else {

                            ids_callback();
                        }
                    })
                    .catch(error => {
                        ids_callback();
                    });

            }, function (err) {
                if (err) {
                    do_callback(err)
                } else {
                    do_callback()
                }
            })
        },
    ], function (err) {
        if (err) {
            helper.endDatabaseConnectionAndSendReponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'Market odds saved successfully.',
            }
            helper.endDatabaseConnectionAndSendReponse(req, res, result);
        }
    });
}

exports.updateSessions = function (req, res, next) {

    let internalData = {};
    let marketIDs = [];
    async.series([
        function (do_callback) {
            let query = `SELECT Matche.id, Matche.event_id FROM matches Matche 
                JOIN series Series ON Matche.series_id = Series.id 
                JOIN sports Sport ON Series.sports_id = Sport.id
                WHERE ( 
                    ( Matche.event_open_date BETWEEN DATE_SUB(NOW(), INTERVAL 5 DAY) AND NOW() AND Series.competition_name='Test Matches' AND Sport.status=1 AND Sport.deleted_at IS NULL AND Series.status=1 AND Series.deleted_at IS NULL AND Matche.match_result=0 AND Matche.status=1 AND Matche.deleted_at IS NULL ) 
                    OR 
                    ( DATE(Matche.event_open_date) = DATE(NOW()) AND Sport.status=1 AND Sport.deleted_at IS NULL AND Series.status=1 AND Series.deleted_at IS NULL AND Matche.match_result=0 AND Matche.status=1 AND Matche.deleted_at IS NULL )
                )`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Matches not found.');
                }
                else {

                    async.eachSeries(results, (singleMatch, ids_callback) => {

                        // get matches from api and process the response data
                        third_party_helper.getSession(singleMatch.event_id)
                            .then(response => {

                                //console.log('response:::::', response)

                                if (typeof response !== 'undefined' && response.length > 0) {

                                    async.eachSeries(response, (singleSession, callback_1) => {

                                        //console.log('singleSession::::########:', singleSession)

                                        // checking record into database
                                        let query = `SELECT id FROM match_sessions WHERE match_id = ${singleMatch.id} AND SelectionId = ${singleSession.SelectionId}`;
                                        req.connection.query(query, function (err, results, fields) {

                                            if (err) {
                                                //console.log('error match sessions finding into database:', err);
                                                callback_1();
                                            }
                                            else if (!results.length) {

                                                // save record into database if not found
                                                let data = {
                                                    match_id: singleMatch.id,
                                                    SelectionId: singleSession.SelectionId,
                                                    RunnerName: singleSession.RunnerName,
                                                    LayPrice1: singleSession.LayPrice1,
                                                    LaySize1: singleSession.LaySize1,
                                                    BackPrice1: singleSession.BackPrice1,
                                                    BackSize1: singleSession.BackSize1,
                                                    GameStatus: singleSession.GameStatus,
                                                    created_at: helper.getCurrentDate(),
                                                    updated_at: helper.getCurrentDate(),
                                                };

                                                req.connection.query('INSERT INTO match_sessions SET ?', data, function (err, results) {

                                                    if (err) {
                                                        //console.log('error match sessions saving into database:', err);
                                                        callback_1();
                                                    } else {
                                                        //console.log('match sessions saved successfully.');

                                                        callback_1();
                                                    }
                                                });
                                            }
                                            else {
                                                callback_1();
                                            }
                                        });

                                    },
                                        function (err) {
                                            if (err) {
                                                ids_callback();
                                            } else {
                                                ids_callback();
                                            }
                                        });

                                } else {

                                    ids_callback();
                                }
                            })
                            .catch(error => {
                                ids_callback();
                            });

                    }, function (err) {
                        if (err) {
                            do_callback(err)
                        } else {
                            do_callback()
                        }
                    })
                
                }
            })
        },
    ], function (err) {
        if (err) {
            helper.endDatabaseConnectionAndSendReponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'match sessions saved successfully.',
            }
            helper.endDatabaseConnectionAndSendReponse(req, res, result);
        }
    });
}

exports.updateScores = function (req, res, next) {

    let internalData = {};
    let marketIDs = [];
    async.series([
        function (do_callback) {
            let query = `SELECT Matche.id, Matche.event_id FROM matches Matche 
                JOIN series Series ON Matche.series_id = Series.id 
                JOIN sports Sport ON Series.sports_id = Sport.id
                WHERE ( 
                    ( Matche.event_open_date BETWEEN DATE_SUB(NOW(), INTERVAL 5 DAY) AND NOW() AND Series.competition_name='Test Matches' AND Sport.status=1 AND Sport.deleted_at IS NULL AND Series.status=1 AND Series.deleted_at IS NULL AND Matche.match_result=0 AND Matche.status=1 AND Matche.deleted_at IS NULL ) 
                    OR 
                    ( DATE(Matche.event_open_date) = DATE(NOW()) AND Sport.status=1 AND Sport.deleted_at IS NULL AND Series.status=1 AND Series.deleted_at IS NULL AND Matche.match_result=0 AND Matche.status=1 AND Matche.deleted_at IS NULL )
                )`;
            req.connection.query(query, function (err, results, fields) {

                if (err) {
                    do_callback(err);
                }
                else if (!results.length) {
                    do_callback('Matches not found.');
                }
                else {

                    async.eachSeries(results, (singleMatch, ids_callback) => {

                        // get matches from api and process the response data
                        third_party_helper.getScore(singleMatch.event_id)
                            .then(response => {

                                //console.log('response:::::', response)

                                if (typeof response !== 'undefined' && response.length > 0) {

                                    async.eachSeries(response, (singleScore, callback_1) => {

                                        //console.log('singleScore::::########:', singleScore)

                                        // checking record into database
                                        let query = `SELECT id FROM match_scores WHERE eventId = ${singleScore.eventId}`;
                                        req.connection.query(query, function (err, results, fields) {

                                            if (err) {
                                                //console.log('error match score finding into database:', err);
                                                callback_1();
                                            }
                                            else if (!results.length) {

                                                // save record into database if not found
                                                let data = {
                                                    eventTypeId: singleScore.eventTypeId,
                                                    eventId: singleScore.eventId,
                                                    score: JSON.stringify(singleScore.score),
                                                    currentSet: singleScore.currentSet,
                                                    currentGame: singleScore.currentGame,
                                                    hasSets: singleScore.hasSets,
                                                    stateOfBall: JSON.stringify(singleScore.stateOfBall),
                                                    currentDay: singleScore.currentDay,
                                                    timeElapsed: singleScore.timeElapsed,
                                                    elapsedRegularTime: singleScore.elapsedRegularTime,
                                                    timeElapsedSeconds: singleScore.timeElapsedSeconds,
                                                    matchType: singleScore.matchType,
                                                    matchStatus: singleScore.matchStatus,
                                                    created_at: helper.getCurrentDate(),
                                                    updated_at: helper.getCurrentDate(),
                                                };

                                                req.connection.query('INSERT INTO match_scores SET ?', data, function (err, results) {

                                                    if (err) {
                                                        //console.log('error match scores saving into database:', err);
                                                        callback_1();
                                                    } else {
                                                        //console.log('match scores saved successfully, Saving match scores runners.');

                                                        callback_1();
                                                    }
                                                });
                                            }
                                            else {
                                                callback_1();
                                            }
                                        });

                                    },
                                        function (err) {
                                            if (err) {
                                                ids_callback();
                                            } else {
                                                ids_callback();
                                            }
                                        });

                                } else {

                                    ids_callback();
                                }
                            })
                            .catch(error => {
                                ids_callback();
                            });

                    }, function (err) {
                        if (err) {
                            do_callback(err)
                        } else {
                            do_callback()
                        }
                    })
                
                }
            })
        },
    ], function (err) {
        if (err) {
            helper.endDatabaseConnectionAndSendReponse(req, res, err);
        } else {

            let result = {
                status: true,
                message: 'match scores saved successfully.',
            }
            helper.endDatabaseConnectionAndSendReponse(req, res, result);
        }
    });
}
// end api real use to update database records