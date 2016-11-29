'use strict';
require('moment-duration-format');
require('moment-timer');
require('moment-round');
const _ = require('lodash');
const moment = require('moment');
const loadBoardPage = require('./loadBoardPage');
const email = require('../emailSender');
const config = require('../../config');
const parseHtmlTable = require('./parseHtmlTable').parseHtmlTable;
const isThereAnyInteresting = require('./parseHtmlTable').isThereAnyInteresting;

let intervalToUpdate = getNextUpdateInterval();
console.log(`${moment().format()}: Next update in  ${intervalToUpdate.format('HH:mm:ss')}`);

//moment.duration(config.updateIntervalInSeconds, 'seconds').timer({ wait: intervalToUpdate, loop: true, executeAfterWait: true }, update);

interval(update, intervalToUpdate, moment.duration(config.updateIntervalInSeconds, 'seconds'));
/*
interval(() => {
    let curTime = moment().utcOffset(config.usersTimeZone).round(30, 'seconds');
    let secondsFromStartOfTheDay = Math.round((curTime - moment().utcOffset(config.usersTimeZone).startOf('day')) / 1000);
    console.log(curTime.format(), secondsFromStartOfTheDay);
}, moment.duration(1, 'seconds'), moment.duration(config.updateIntervalInSeconds, 'seconds'));
*/

function getNextUpdateInterval() {
    let secondsFromStartOfTheDay = moment().unix() % (60 * 60 * 24);
    let step = config.updateIntervalInSeconds;
    let intervalToUpdate = step - secondsFromStartOfTheDay % step;
    console.log(`${secondsFromStartOfTheDay}   ${step}    ${intervalToUpdate}`);
    return moment.duration(intervalToUpdate, 'seconds');
}

function update() {
    let curTime = moment().utcOffset(config.usersTimeZone).round(30, 'seconds');
    let secondsFromStartOfTheDay = Math.round((curTime - moment().utcOffset(config.usersTimeZone).startOf('day')) / 1000);

    loadBoardPage().then(tables => {
        validateResponse(tables);

        let isMandatory = _.some(config.mandatoryUpdatesSchedule, d => d.asSeconds() === secondsFromStartOfTheDay);

        let parsedTables = _.map(tables, t => parseHtmlTable(t));
        let isThereNoTablesUpdate = !isThereAnyInteresting(parsedTables);

        console.log(`${curTime.format()}:   ${!isMandatory && isThereNoTablesUpdate ? 'no changes' : 'UPDATE'}`);
        if (!isMandatory && isThereNoTablesUpdate)
            return 0;

        config.lastTables = tables;
        return isMandatory ? email.sendMandatoryEmail(tables) : email.sendUpdateEmail(tables);
    })
    .catch(err => console.warn('ERROR: board/updateLoop.js:13\n' + err));
}

function validateResponse(tables) {
    if (!tables) {
        throw new Error('Can not find Cargo board table in response.');
    }
    else if (tables.length !== 2) {
        throw new Error('Parsed tables length is not equal to 2, but ' + tables.length);
    }
    else if (_.some(tables, str => !str || str === '')) {
        throw new Error('At least one of tables is null or empty string');
    }
}

/*
function interval(func, wait, times) {
    var interv = function(w, t) {
        return function() {
            if (typeof t === 'undefined' || t-- > 0) {
                setTimeout(interv, w);
                try {
                    func.call(null);
                }
                catch(e) {
                    t = 0;
                    throw e.toString();
                }
            }
        };
    }(wait, times);

    setTimeout(interv, wait);
}
*/
function interval(func, firstCall, wait, times) {
    var interv = function() {
        if (typeof times === 'undefined' || times-- > 0) {
            setTimeout(interv, wait.asMilliseconds());
            try {
                func.call(null);
            }
            catch(e) {
                times = 0;
                throw e.toString();
            }
        }
    };

    setTimeout(interv, firstCall.asMilliseconds());
}