'use strict';
const _ = require('lodash');
const rp = require('request-promise');
const config = require('../../config.json');

module.exports = function() {
    var options = {
        uri: config.sourcePageUrl,
        transform: parsePage
    };

    function parsePage(body, response, resolveWithFullResponse) {
        let tables = body.match(/<table class="table_data flights flights_((.|\r|\n)*?)<\/table>/g);
        if (tables) {
            tables = _.map(tables, str => str
                .replace('<table class="table_data flights flights_d">', 'Departure<table>')
                .replace('<table class="table_data flights flights_a">', 'Arrival<table>')
                .replace(/ class=".*?"/g, '')
                .replace(/(\r|\n|\t)/g, '')
                .replace(/<table>/g, '<table cellspacing="0" border="1" cellpadding="1" width="500" style="font-family:Arial,Serif;font-size: 14px">'));
        }
        return tables;
    }

    return rp(options);
};
