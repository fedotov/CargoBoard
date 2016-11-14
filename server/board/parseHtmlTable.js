'use strict';
const _ = require('lodash');
const config = require('../../config.json');

exports.parseHtmlTable = function(htmlTable) {
    var tableArray = [];

    let headEndIndex = htmlTable.indexOf('</thead>');
    let rows = htmlTable.substring(headEndIndex).match(/<tr.*?<\/tr>/g);

    rows.forEach(r => {
        let cells = r.match(/<td>(.*?)<\/td>/g);
        cells = _.map(cells, c => c.replace('<td>', '').replace('</td>', ''));
        tableArray.push(cells);
    });

    return tableArray;
};

exports.isThereAnyInteresting = function(tables) {

    function removeIgnoredFlights(table) {
        for (let i = 0; i < table.length; ) {
            if (_.some(config.ignoreFlights, flt => table[i][0].indexOf(flt) === 0))
                table.splice(i, 1);
            else
                ++i;
        }
    }

    function removePreviousFlights(table, lastFlights) {
        for (let i = 0; i < table.length; ) {
            if (_.some(lastFlights, flt => table[i][0] === flt))
                table.splice(i, 1);
            else
                ++i;
        }
    }

    let interesting = false;
    tables.forEach((table, index) => {
        removeIgnoredFlights(table);
        let importantFlights = _.map(table, row => row[0]);
        removePreviousFlights(table, config.lastFlights[index] || []);

        console.log(index, `'${config.lastFlights[index].join(',')}'      '${_.map(table, row => row[0]).join(',')}'`);
        config.lastFlights[index] = importantFlights;
        interesting |= table.length > 0;
    });
    return interesting;
};
