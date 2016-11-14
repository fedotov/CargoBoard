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

moment.duration(config.updateIntervalInSeconds, 'seconds')
    .timer({ wait: intervalToUpdate, loop: true, executeAfterWait: true }, update);

function getNextUpdateInterval() {
    let secondsFromStartOfTheDay = moment().unix() % (60 * 60 * 24);
    let step = config.updateIntervalInSeconds;
    let intervalToUpdate = step - secondsFromStartOfTheDay % step;
    return moment.duration(intervalToUpdate, 'seconds');
}

function update() {
    let curTime = moment().round(30, 'seconds');

    loadBoardPage().then(tables => {
        validateResponse(tables);

        let secondsFromStartOfTheDay = Math.round((curTime - moment().startOf('day')) / 1000);
        let isMandatory = _.some(config.mandatoryUpdatesSchedule, d => d.asSeconds() === secondsFromStartOfTheDay);

        let parsedTables = _.map(tables, t => parseHtmlTable(t));
        let isThereNoTablesUpdate = !isThereAnyInteresting(parsedTables);

        console.log(`${curTime.format()}:   ${!isMandatory && isThereNoTablesUpdate ? 'no changes' : 'UPDATE'}`);
        console.log(isMandatory, isThereNoTablesUpdate, secondsFromStartOfTheDay);
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
