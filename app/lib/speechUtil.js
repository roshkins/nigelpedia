/*
 * Copyright 2016 Sony Corporation
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions, and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS ``AS IS'' AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED.  IN NO EVENT SHALL THE AUTHOR OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 * OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
 * HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY
 * OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF
 * SUCH DAMAGE.
 *
 *
 speechUtil v1.1.1-1
 */

speechUtil = (function() {

    var self;
    function speechUtil() {
        self = this;
    }

    /**
    This function takes a user's speech input and returns the commands you need. For instance for fullSpeechString="find a restaurant near me" and a commandsArr = ["find a restaurant"] returns ["near me]
    @param {string} args : The list of items to be spoken
    @param {array} commandsArr : The list of items to be spoken

      @return {array} : Returns the array of user strings

    {"recognitionSetString":"{ \"AppPrior\": { \"SemanticAnalysisResults\": [{\"SpeechRecogResult\": \"find a restaurant that serves Italian food\", \"Score\": 1.0, \"SlotSets\": []}]}"}


    */
    speechUtil.prototype.getUserSpeechInputArr = function(args) {
        console.log(args.recognitionSetString);
        var recognitionSetString = JSON.parse(args.recognitionSetString);
        return recognitionSetString.AppPrior.SemanticAnalysisResults;
    }

   /**
    This function takes a user's speech input and returns the commands you need. For instance for fullSpeechString="find a restaurant near me" and a commandsArr = ["find a restaurant"] returns ["near me]
    @param {string} args : The list of items to be spoken
    @param {array} commandsArr : The list of items to be spoken

      @return {array} : Returns the array of user strings

    */
    speechUtil.prototype.getUserSpeechCommand = function(args) {
        var speechString = "";
        if (args == undefined) {
            return speechString;
        }
        if (args.recognitionSetString != undefined) {
            speechString = JSON.parse(args.recognitionSetString).SemanticAnalysisResults[0].SpeechRecogResult
        }

        return speechString;

    }

    /**
    This function takes a user's speech input and returns the commands you need. For instance for fullSpeechString="find a restaurant near me" and a commandsArr = ["find a restaurant"] returns ["near me]
    @param {array} fullSpeechString : The list of items to be spoken. Just pass the args variable on preprocess
    @param {array} commandsArr : The list of items to be spoken.

    @return {object} : Returns the array of the correct matched item

    Example: "remind me to take a shower before my date when i get home name it night out"
    var usercommands = speechUtil.getUserRequests(args, [
        {"remind me to":["*"], "remind me (of )? what i said about (my|the|a|this)?":["*"], "help me to remember":["*"]},
        {"when i get (to)?":contexts, "after i get (to)?":contexts},
        {"name it":["*"]}
        ]);
    */
    speechUtil.prototype.getUserRequests = function(speechString, commandsArr) {
      //First loop through all of the given commands

      var userCommand = {};

      for (section in commandsArr) {
          var matchString = commandsArr[section];
          if (matchString[matchString.length -1] != "$") {
            matchString += "$";
          }
          var re = new RegExp(matchString);
          if (re.test(speechString)) {
              userCommand.section = section;
              userCommand.regex = matchString;
              matches = speechString.match(matchString);
              console.log(matches);
              for (var x = 0; x < matches.length; x++) {
                  if (matches[x] != undefined) {
                      matches[x] = matches[x].trim();
                  }
              }
              userCommand.matches = matches;
              return userCommand;
          }
      }
      return {};

    }

    /**
    Recursively speak the items in the given list
    @param {array} listItems : The list of items to be spoken
    @param {object} callback : The callback for the different states of the speaking process
      @callback.onFinished() : Called when all lines are finished speaking
      @callback.onItem(currentItem) : Called after each item is spoken
      @callback.onerror(error) : called when there is an error
    */
    speechUtil.prototype.speakList = function(listItems, callback, currentItem) {
        if (currentItem == undefined) {
            currentItem = 0;
        }
        //We have reached the last item so return
        if (currentItem == listItems.length) {
            if (callback.onFinished != undefined) {
              callback.onFinished();
            }
            return;
        }

        var speechCallback = {
            onstart:function() {
                console.log("on start called");
            },
            onend:function() {
                if (callback.onItem != undefined) {
                    callback.onItem(currentItem);
                }

                console.log("on end called");
                self.speakList(listItems, callback, currentItem+1);
            },
            onerror:function(error) {
                if (callback.onerror != undefined) {
                    callback.onerror(error);
                }

            }
        }
        self.speak(listItems[currentItem], speechCallback)
    }


    /**
    Speak a single line of text
    @param {string} text : The line of text to speak
    @param {object} callback : The callback for the states of speaking
      @callback.onstart() : Called when the speaking startSegment
      @callback.onend() : Called when the speaking has finished
      @callback.onerror(error) : Called when there is an error
    */
    speechUtil.prototype.speak = function(text, callback) {
        if (callback == undefined) {
            callback = {};
        }
        var synthesis = da.SpeechSynthesis.getInstance();
        synthesis.speak(text, {
            onstart: function () {
                console.log('speak start');
                if (callback.onstart != undefined) {
                    callback.onstart();
                }
            },
            onend: function () {
                console.log('speak onend');
                if (callback.onend != undefined) {
                    callback.onend();
                }
                else {
                    console.log("stopsegment called in speechUtil.js")
                    da.stopSegment();
                }
            },
            onerror: function (error) {
                console.log('speak cancel: ' + error.messsage);
                console.log(error);
                if (callback.onerror != undefined) {
                    callback.onerror(error);
                }
            }
        });
    }

    /**
    This function makes it simple to have a dialog with the user
    @param {string} text : The first line of text spoken to the user
    @param {object} responseCallbacks : The callback for what you want to happen when a user says a specific thing. If you set a callback to "ANY" then it will automaticcaly =
    @param {object} callback : The callback for the states of speaking
      @callback.onstart() : Called when the speaking startSegment
      @callback.onend() : Called when the speaking has finished
      @callback.onerror(error) : Called when there is an error
    */
    speechUtil.prototype.conversation = function(text, responseCallbacks, callback) {
        if (callback == undefined) {
            callback = {};
        }
        var synthesis = da.SpeechSynthesis.getInstance();
        synthesis.speak(text, {
            onstart: function () {
                console.log('speak start');
                if (callback.onstart != undefined) {
                    callback.onstart();
                }
            },
            onend: function () {
                console.log('speak onend');
                if (callback.onend != undefined) {
                    callback.onend();
                }

                var speechToText = new da.SpeechToText();
                speechToText.startSpeechToText({
                    onsuccess: function (results) {
                      console.log("got the result!!");

                      var speechText = results.join(" ").trim();
                      if (responseCallbacks["ANY"] != undefined) {
                          responseCallbacks["ANY"](speechText);
                          return;
                      }

                      console.log(speechText);
                      var foundResponse = false;
                      for (var response in responseCallbacks) {
                          var responseRE = new RegExp(response, "i");
                          console.log({responseRE:responseRE, speechText:speechText})
                          if(responseRE.test(speechText)) {
                              responseCallbacks[response](speechText);
                              foundResponse = true;
                              console.log("found item");
                          }
                          else {
                              console.log("missed item");
                          }
                      }
                      if (!foundResponse && responseCallbacks["error"] != undefined) {
                          responseCallbacks["error"]();
                      }


                    },
                    onerror: function (error) {
                        if (responseCallbacks["error"] != undefined) {
                          responseCallbacks["error"]();
                        }
                        console.log(error);
                    }
                });

            },
            onerror: function (error) {
                console.log('speak cancel: ' + error.messsage);
                console.log(error);
                if (responseCallbacks["error"] != undefined) {
                  responseCallbacks["error"]();
                }
                if (callback.onerror != undefined) {
                    callback.onerror(error);
                }
            }
        });
    }

    /**
    This is a helper function that makes it easier to speak a list of itmes.
    it takes a list like [red, blue, orange] and converts it to
    red, blue and orange
    @param {array} items : The array of items
    @param {string} separator : The separator for each item
    @param {string} lastSeperator : The separator for the last item. If empty the default is used
    */
    speechUtil.prototype.listToString = function(items, separator, lastSeperator) {
        var fullString = "";
        for (var x=0; x<items.length; x++) {
            //This is the last item
            if (x+1 == items.length && lastSeperator != undefined && items.length > 1) {
              fullString += " "+lastSeperator+" ";
            }
            else if (x > 0) {
              fullString += " "+separator+" ";
            }
            fullString += items[x];
        }
        return fullString;
    }

    return speechUtil;

})();
