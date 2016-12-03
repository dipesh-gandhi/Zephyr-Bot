
var initBotController = function(bot, controller, luis, weather, sentiment){

/*
    controller.on('bot_channel_join', function(bot, message) {
        // console.log('listener fired!');
        bot.send({text: 'Here I am in a channel now!'})
    });
*/
    controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
        controller.storage.users.get(message.user, function(err, user) {
            if (user && user.name) {
                bot.reply(message, 'Hey ' + user.name + '!!');
            } else {
                bot.reply(message, 'Hi there!');
            }

            bot.reply(message, 'You can ask me anything from booking a flight, checking flight status, or get weather for specific city');
        });
    });

    controller.hears(['help'], 'message_received', function(bot, message) {
          bot.reply(message, 'You can ask me things like\n "Book 2 adult tickets to Paris next Monday", "Check flight status for SouthWest 1242, or "what is weather in 80123". Try it now..');
    });

    controller.hears(['call me (.*)', 'my name is (.*)'], 'message_received', function(bot, message) {
        var name = message.match[1];
        controller.storage.users.get(message.user, function(err, user) {
            if (!user) {
                user = {
                    id: message.user,
                };
            }
            user.name = name;
            controller.storage.users.save(user, function(err, id) {
                bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
            });
        });
    });

    controller.hears(['what is my name', 'who am i'], 'message_received', function(bot, message) {

        controller.storage.users.get(message.user, function(err, user) {
            if (user && user.name) {
                bot.reply(message, 'Your name is ' + user.name);
            } else {
                bot.startConversation(message, function(err, convo) {
                    if (!err) {
                        convo.say('I do not know your name yet!');
                        convo.ask('What should I call you?', function(response, convo) {
                            convo.ask('You want me to call you `' + response.text + '`?', [
                                {
                                    pattern: 'yes',
                                    callback: function(response, convo) {
                                        // since no further messages are queued after this,
                                        // the conversation will end naturally with status == 'completed'
                                        convo.next();
                                    }
                                },
                                {
                                    pattern: 'no',
                                    callback: function(response, convo) {
                                        // stop the conversation. this will cause it to end with status == 'stopped'
                                        convo.stop();
                                    }
                                },
                                {
                                    default: true,
                                    callback: function(response, convo) {
                                        convo.repeat();
                                        convo.next();
                                    }
                                }
                            ]);

                            convo.next();

                        }, {'key': 'nickname'}); // store the results in a field called nickname

                        convo.on('end', function(convo) {
                            if (convo.status == 'completed') {
                                bot.reply(message, 'Okay! I will update my dossier...');

                                controller.storage.users.get(message.user, function(err, user) {
                                    if (!user) {
                                        user = {
                                            id: message.user,
                                        };
                                    }
                                    user.name = convo.extractResponse('nickname');
                                    controller.storage.users.save(user, function(err, id) {
                                        bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                    });
                                });



                            } else {
                                // this happens if the conversation ended prematurely for some reason
                                bot.reply(message, 'OK, nevermind!');
                            }
                        });
                    }
                });
            }
        });
    });

    //Check weather
    controller.hears(['what is weather in (.*)', 'what\'s weather in (.*)', 'weather in (.*)', 'weather (.*)'], 'message_received', function(bot, message) {
      var zipcode = message.match[1];

      bot.startConversation(message, function(err, convo) {

          if (!err) {

            controller.storage.users.get(message.user, function(err, user) {
                if (user && user.name && user.zipcode) {

                    weather.getWeatherByZip(zipcode, function(data){
                          console.log("--> " + JSON.stringify(data));
                          if(typeof data.message == 'undefined'){
                            convo.say("You last weather lookup was for " + user.zipcode);
                            //save weather
                            user.zipcode = zipcode;
                            //user.name = message.user.name;
                            controller.storage.users.save(user, function(err, id) {
                                console.log('--> Stored Name: ' + user.name + ' zip: ' + user.zipcode );
                            });
                            convo.say("Forcast for " + data.name + " (" + zipcode + ") is " + data.main.temp + "F with " + data.weather[0].description);
                            convo.next();
                          }else{
                            bot.reply(message, data.message);
                            convo.repeat();
                            convo.next();
                          }
                    });
                } else {
                    console.log('-->no zip code yet');

                      weather.getWeatherByZip(zipcode, function(data){
                            console.log("--> " + JSON.stringify(data));
                            if(typeof data.message == 'undefined'){

                              if(typeof user !== 'undefined'){
                                  //save weather
                                  if (!user) {
                                      user = {
                                          id: message.user,
                                      };
                                  }
                                  user.zipcode = zipcode;
                                  //user.name = message.user.name;
                                  controller.storage.users.save(user, function(err, id) {
                                      console.log('Stored - Name: ' + user.name + ' zip: ' + user.zipcode );
                                  });
                              }

                              bot.reply(message, "Weather in " + data.name + " is " + data.main.temp + "F with " + data.weather[0].description);
                              convo.next();
                            }else{
                              bot.reply(message, data.message);
                              convo.repeat();
                              convo.next();
                            }
                      });

                }



            });

         }

      });
    });

    //weather
    controller.hears(['weather'], 'message_received', function(bot, message) {

        bot.startConversation(message, function(err, convo) {
              controller.storage.users.get(message.user, function(err, user) {
                  if (user && user.zipcode) {
                    weather.getWeatherByZip(user.zipcode, function(data){
                          console.log("--> " + JSON.stringify(data));
                          if(typeof data.message == 'undefined'){
                            convo.say("Forcast for " + data.name + " (" + user.zipcode + ") is " + data.main.temp + "F with " + data.weather[0].description);
                            convo.next();
                          }else{
                            convo.say(data.message);
                            convo.next();
                          }
                    });
                  }else{
                    convo.say("You must ask for weather with location");
                    convo.stop();
                  }
              });
        });
    });

    //Shutdown Bot
    controller.hears(['shutdown'], 'message_received', function(bot, message) {

        bot.startConversation(message, function(err, convo) {

            convo.ask('Are you sure you want me to shutdown?', [
                {
                    pattern: bot.utterances.yes,
                    callback: function(response, convo) {
                        convo.say('Bye!');
                        convo.next();
                        setTimeout(function() {
                            process.exit();
                        }, 3000);
                    }
                },
            {
                pattern: bot.utterances.no,
                default: true,
                callback: function(response, convo) {
                    convo.say('*Phew!*');
                    convo.next();
                }
            }
            ]);
        });
    });


    //For Fight related queries to LUIS
    controller.hears(['book','ticket','tickets', 'status', 'flight'], 'message_received', function(bot, message) {

        var location, category, numOfTickets, flightDate;

        bot.startConversation(message, function(err, convo) {

            //Check Luis
            luis.getIntent(message.text, function(data){

              console.log("--> Intent is " + data.topScoringIntent.intent);
              switch (data.topScoringIntent.intent) {
                  case "None":
                      convo.say('Not sure how to respond');
                      break;
                  case "Book Flight":
                      var entities = data.entities;
                      for(var key in entities) {
                         //console.log(key, entities[key].type);
                         switch (entities[key].type) {
                            case "builtin.geography.country":
                              location = entities[key].entity;
                              break;
                            case "builtin.geography.city":
                              location = entities[key].entity;
                              break;
                            case "builtin.number":
                              numOfTickets = entities[key].entity;
                              break;
                            case "Category":
                              category = entities[key].entity;
                              break;
                            case "builtin.datetime.date":
                              flightDate = entities[key].resolution.date;
                              break;
                            default:
                          }
                      }
                      convo.ask("You want " + numOfTickets + " " + category + " tickets to " + location + " on " + flightDate + ". Is this correct?", [
                          {
                              pattern: 'yes',
                              callback: function(response, convo) {
                                  convo.say('Great, you can complete your booking here: ' + 'http://bit.ly/2gmacTl');
                                  convo.next();
                              }
                          },
                          {
                              pattern: 'no',
                              callback: function(response, convo) {
                                  // stop the conversation. this will cause it to end with status == 'stopped'
                                  convo.repeat();
                                  convo.next();
                              }
                          },
                          {
                              default: true,
                              callback: function(response, convo) {
                                  convo.repeat();
                                  convo.next();
                              }
                          }
                      ]
                    );
                    break;
              case "Flight Status":
              var message_options = [
                    "Your flight is on time",
                    "Your flight is delayed by 1 hour",
                      "Your flight is delayed by 30 minutes"
                    ]
                    var random_index = Math.floor(Math.random() * message_options.length)
                    var chosen_message = message_options[random_index]
                    convo.say(chosen_message)
                    convo.next();
                    break;
              default:
                    convo.say('Not sure how to respond');
                    convo.next();
              }


            });
         });
    });

    //Catch all
    controller.hears(['(.*)'], 'message_received', function(bot, message) {

      var msgSentiment = sentiment(message.text);
      console.log("Sentiment: " + JSON.stringify(msgSentiment));
      bot.reply(message, "I have no idea what that means. Try again");

    });
/*
    controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
        'direct_message,direct_mention,mention', function(bot, message) {

            var hostname = os.hostname();
            var uptime = formatUptime(process.uptime());

            bot.reply(message,
                ':robot_face: I am a bot named <@' + bot.identity.name +
                 '>. I have been running for ' + uptime + ' on ' + hostname + '.');

        });
*/

}

exports.initBotController = initBotController;
