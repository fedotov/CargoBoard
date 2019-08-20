'use strict';

console.log('start ...');

require('./startServer');
require('./board/updateLoop');

process.on('SIGINT', function exit() {
    require('../config.json').save();
    console.log('exit');
    process.exit();
});
