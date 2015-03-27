var nodemailer = require('nodemailer');
var config = require('./config.json');
var request = require('request');
var _ = require('lodash');
var phantom = require('phantom');
var transporter; // reusable transporter object using SMTP transport
var targetEmail;

function log() {
  var args = [];
  args.push(new Date());
  args = args.concat(Array.prototype.slice.call(arguments));
  console.log.apply(null, args);
}

function prepareNodemailer() {
  var user = process.argv[2];
  var pass = process.argv[3];

  if (!user || !pass) {
    throw new Error('No user/pass provided. Usage: node index.js user@gmail.com p455w0rd');
  }

  targetEmail = user;

  var config = {
    "service": "Gmail",
    "auth": {
      "user": user,
      "pass": pass
    }
  }

  return nodemailer.createTransport(config);
}

function sendmail(eventName) {
  var mailOptions = {
    from: 'pb-monitor-tickets@lushchick.org',
    to: targetEmail,
    subject: eventName + ' - tickets are available <eom>',
    text: ''
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      log('ERROR, message was not sent: ' + err);
    } else {
      console.log('\n\n\n-------\nMessage sent: ' + info.response + '\n-------\n\n\n');
    }
  });  
}

function pbApiRequest(sessionId, cb) {
  log('Making request');

  config.pbApi.qs = { wsuid: sessionId };

  request(config.pbApi, function(err, res, data) {
    var ticketsAvailable = false;
    if (res.statusCode === 200) {
      var sector = data.sectors.sector;
      var block = _.find(sector, { name: "Блок 29" }) || sector[0];
      
      if (!block) {
        err = new Error('ERROR: Could not find any block!');
      } else if (block.priceZones.priceZone.price > 0) {
        ticketsAvailable = true;
      }
    } else if (!err) {
      err = new Error('ERROR, response is not ok: "' + res.body + '"');
    }
    
    cb(err, ticketsAvailable, data || {});
  });  
}

function getWsuid(cb) {
  log('started');
  phantom.create(function(ph) {
    ph.createPage(function(page) {
      log('Fetching sessionId from "' + config.pbWebUrl + '"');
      page.open(config.pbWebUrl, function(status) {
        
        page.evaluate(
          function() {
            return window.OctTicketWidget.WidgetSession;
          },
          function(result) {
            log('sessionId: ' + result);
            cb(null, result);
            ph.exit();
          }
        );

      });
    });
  });
}

function main() {
  transporter = prepareNodemailer();

  getWsuid(function(err, sessionId) {
    if (err) {
      return log('ERROR: ', err);
    }

    pbApiRequest(sessionId, function(err, ticketsAvailable, data) {
      if (err) {
        log('ERROR: ', err);
      }
      if (ticketsAvailable) {
        sendmail(data.name);
      } else {
        log('No tickets available yet');
      }
    });
  });  
}

main();