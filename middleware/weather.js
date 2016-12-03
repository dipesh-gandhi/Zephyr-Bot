var config = require('config');
var Client = require('node-rest-client').Client;

var client = new Client();
var endpoint = config.Weather.weatherUri;
console.log("--> Using Weather " + endpoint);

var getWeatherByZip = function(zipcode, result){
  console.log("--> zip=" + zipcode);
  if(typeof zipcode !== 'undefined') {
      var url = endpoint + zipcode;
      client.get(url, function (data, response) {
              // parsed response body as js object
              result(data);
      }).on('error', function (err) {
          console.log('something went wrong on the request', err.request.options);
      });
  }
}

exports.getWeatherByZip = getWeatherByZip;
