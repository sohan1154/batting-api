var axios = require('axios');

axios.defaults.baseURL = config.betFairAPIURL;
axios.defaults.headers.post['Content-Type'] = 'application/json';

function updateHeaders() {
    // axios.defaults.headers.common['Authorization'] = "Bearer " + token;
}

function readError(error) {
    // console.log('error:::', error)

    let message;
    let errorMsg = error;

    if (typeof errorMsg === 'undefined') {
        message = "Something went wrong, Please try again.";
    }
    else if (typeof errorMsg === 'object') {

        if (typeof errorMsg.message !== 'undefined') {
            message = errorMsg.message;
        }
        else if (typeof errorMsg.error !== 'undefined') {
            message = errorMsg.error;
        }
        else {
            message = "Something went wrong, please try again.";
        }
    }
    else {
        message = errorMsg;
    }

    return message;
}

function readResponse(response) {
    // console.log('response::::', response.data);
    return response.data;
}

exports.getSports = () => {
    return axios.get(`/fetch_data?Action=listEventTypes`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getSeries = (sportsID) => {
    return axios.get(`/fetch_data?Action=listCompetitions&EventTypeID=${sportsID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getMatches = (sportsID, seriesID) => {
    return axios.get(`/fetch_data?Action=listEvents&EventTypeID=${sportsID}&CompetitionID=${seriesID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getMarkets = (eventID) => {
    return axios.get(`/fetch_data?Action=listMarketTypes&EventID=${eventID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getMarketsSelection = (marketID) => {
    return axios.get(`/fetch_data?Action=listMarketRunner&MarketID=${marketID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getMarketOdds = (marketID) => {
    return axios.get(`/listMarketBookOdds?market_id=${marketID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getSession = (matchID) => {
    return axios.get(`/listMarketBookSession?match_id=${matchID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}

exports.getScore = (matchID) => {
    return axios.get(`/score?match_id=${matchID}`).then(response => readResponse(response)).catch(error => { throw readError(error); });
}
