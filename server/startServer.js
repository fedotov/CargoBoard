'use strict';
require('moment-duration-format');
const _ = require('lodash');
const fs = require('fs-extra-promise');
const moment = require('moment');
const config = require('../config.json');

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined' ? args[number] : match;
        });
    };
}

config.save = function() {
    let str = JSON.stringify(this, null, '    ');
    fs.writeFileSync('config.json', str);
};

config.mandatoryUpdatesSchedule = _.map(config.mandatoryUpdatesSchedule, str => moment.duration(str));
