var config = require('config');
var Botkit = require('../node_modules/botkit/lib/Botkit.js');
const botController = require('./controller.js');


//Set Mongo
var mongoStorage = require('botkit-storage-mongo')({mongoUri: config.Mongo.mongoUri});
console.log("--> Using Mongo " + config.Mongo.mongoUri);

//Set LUIS
var luis = require("../middleware/luis.js");

//Set weather
var weather = require("../middleware/weather.js");

//Set Sentiment
var sentiment = require('sentiment');


var getBot = function(){

  var controller = Botkit.consolebot({
      debug: config.BotKit.debug,
      storage: mongoStorage
  });

  var bot = controller.spawn();
  botController.initBotController(bot, controller, luis, weather, sentiment);

}

var getTwilioBot = function(){
  const TwilioSMSBot = require('botkit-sms')
  const controller = TwilioSMSBot({
  	account_sid: config.Twilio.account_sid,
  	auth_token: config.Twilio.auth_token,
  	twilio_number: config.Twilio.twilio_number,
    debug: config.BotKit.debug,
    storage: mongoStorage
	})

  var bot = controller.spawn({})

  controller.setupWebserver(config.Twilio.webhookServerPort, function (err, webserver) {
  	controller.createWebhookEndpoints(controller.webserver, bot, function () {
    	console.log('TwilioSMSBot is online!')
  	})
  })

  botController.initBotController(bot, controller, luis, weather, sentiment);

}

exports.getBot = getBot;
exports.getTwilioBot = getTwilioBot;
