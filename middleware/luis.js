var config = require('config');
var Client = require('node-rest-client').Client;

var client = new Client();
var endpoint = config.LUIS.luisUri;
console.log("--> Using LUIS " + config.LUIS.luisUri);

var getIntent = function(userInput, botResult){

  if(typeof userInput !== 'undefined') {
    client.get(endpoint + userInput, function (data, response) {
        // parsed response body as js object
        console.log(data);
        botResult(data);

        // raw response
        //console.log(response);

    });
  }
}

exports.getIntent = getIntent;
