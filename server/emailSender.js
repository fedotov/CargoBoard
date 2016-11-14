'use strict';
const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const config = require('../config.json');

const transporter = nodemailer.createTransport(config.mailerTransport);

exports.sendUpdateEmail = function(tables) {
    let options = { html: config.emailPattern.format(tables.join('<br/><br/>')) };
    Object.assign(options, config.updateEmailSettings);
    return sendEmails(options);
};

exports.sendMandatoryEmail = function(tables) {
    let options = { html: config.emailPattern.format(tables.join('<br/><br/>')) };
    Object.assign(options, config.mandatoryEmailSettings);
    return sendEmails(options);
};

function sendEmails(options) {
    let addressees = options.to;
    delete options.to;

    return Promise.map(addressees, address => {
        let o = Object.assign({}, options);
        o.to = address;
        sendEmail(o);
    });
}

function sendEmail(options) {
    return new Promise(function (resolve, reject) {
        transporter.sendMail(options, function(error, info) {
            if (error)
                reject(error);
            else
                console.log('Message sent: ' + info.response);
            resolve(info);
        });
    });
}
