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

 {"args":  {"recognitionSetString":"{  \"SemanticAnalysisResults\": [{\"SpeechRecogResult\": \"search encyclopedia for aviation\"}]}"}  }
 */

var speechText;
var callbackErrorMessage;
var speechUtil = new speechUtil();

/**
 * The callback to prepare a segment for play.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onpreprocess = function(trigger, args) {
  outputLog("[SpeechToText] onpreprocess", { trigger: trigger, args: args });
  var fullSpeechString = speechUtil.getUserSpeechCommand(args);
  args = { args: {} };
  args.args.searchWord = (fullSpeechString.match(
    /.*?encyclopedia(?: ?for)?(.*)/i
  ) || ["", ""])[1];
  speechText = "";
  callbackErrorMessage = "";
  da.startSegment(trigger, args);
};

/**
 * The callback to start a segment.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onstart = function(trigger, args) {
  outputLog("[SpeechToText] onstart", { trigger: trigger, args: args });
  var synthesis = da.SpeechSynthesis.getInstance();
  if (args.searchWord.length < 1) {
    synthesis.speak(
      "Welcome to enpeedeeuh. What would you like to learn about? Use a word or short phrase, like 'aviation' or 'wendy house'. Say stop to cancel.",
      {
        onstart: function() {
          outputLog("[SpeechToText] speak onstart");
        },
        onend: function() {
          outputLog("[SpeechToText] speak onend");

          var speechToText = new da.SpeechToText();
          speechToText.startSpeechToText(callbackobject);
        },
        onerror: function(error) {
          outputLog("[SpeechToText] speak cancel: " + error.message);
          da.stopSegment();
        }
      }
    );
  } else {
    speechText = args.searchWord.trim();
    fetchArticle();
  }
};

/**
 * The callback to resume a segment for play.
 */

var getWikipediaResult = function(word, url, synthesis) {
  $.ajax({
    url: url,
    xhr: function() {
      return da.getXhr();
    },
    type: "GET",
    // dataType: "xml",
    success: function(data, textStatus, jqXHR) {
      var article = $(data).text();
      outputLog("Wikipedia response:" + article.split("."));
      speechUtil.speakList(article.split("."), {
        onstart: function() {
          outputLog("[SpeechToText] speak onstart");
        },
        onFinished: function() {
          outputLog("[SpeechToText] speak onend");
          da.stopSegment();
        },
        onerror: function(error) {
          outputLog("[SpeechToText] speak cancel: " + error.message);
          da.stopSegment();
        }
      });
    },
    error: function(jqXHR, textStatus, errorThrown) {
      synthesis.speak(
        "There was an error with your word " +
          word +
          ". Can you try a different word or phrase? For example, say banana instead of banana tree.",
        {
          onstart: function() {
            outputLog("[SpeechToText] speak onstart");
          },
          onend: function() {
            outputLog("[SpeechToText] speak onend");
            var speechToText = new da.SpeechToText();
            speechToText.startSpeechToText(callbackobject);
            // da.stopSegment();
          },
          onerror: function(error) {
            outputLog("[SpeechToText] speak cancel: " + error.message);
            da.stopSegment();
          }
        }
      );
    }
  });
};

var fetchArticle = function() {
  outputLog("[SpeechToText] onresume");
  var synthesis = da.SpeechSynthesis.getInstance();
  if (0 <= speechText.indexOf("stop")) {
    synthesis.speak("bye bye.", {
      onstart: function() {
        outputLog("[SpeechToText] speak onstart");
      },
      onend: function() {
        outputLog("[SpeechToText] speak onend");
        da.stopSegment();
      },
      onerror: function(error) {
        outputLog("[SpeechToText] speak cancel: " + error.message);
        da.stopSegment();
      }
    });
    return;
  }
  var synthesis = da.SpeechSynthesis.getInstance();
  if (speechText != "") {
    var word =
      speechText.charAt(0).toUpperCase() +
      speechText.substring(1).toLowerCase();
    word = word.replace(/\W/, "_");
    outputLog("sppechText is", word);
    var url = "https://en.wikipedia.org/api/rest_v1/page/html/" + word;
    outputLog(url);
    getWikipediaResult(word, url, synthesis);
  } else {
    synthesis.speak(
      "The speech to text API could not recognize what you said. Reason is " +
        callbackErrorMessage,
      {
        onstart: function() {
          outputLog("[SpeechToText] error message speak start");
        },
        onend: function() {
          outputLog("[SpeechToText] error message speak onend");
          da.stopSegment();
        },
        onerror: function(error) {
          outputLog(
            "[SpeechToText] error message speak cancel: " + error.message
          );
          da.stopSegment();
        }
      }
    );
  }
};

da.segment.onresume = fetchArticle;
/**
 * The callback to get result from SpeechToText api.
 *
 * @type {{onsuccess: callbackobject.onsuccess, onerror: callbackobject.onerror}}
 */
var callbackobject = {
  onsuccess: function(results) {
    outputLog(
      "[SpeechToText] : SpeechToText process has finished successfully"
    );
    outputLog("[SpeechToText] : Results = " + results);

    speechText = results[0];
    callbackErrorMessage = "";
  },
  onerror: function(error) {
    outputLog("[SpeechToText] : SpeechToText error message = " + error.message);
    outputLog("[SpeechToText] : SpeechToText error code = " + error.code);

    speechText = "";
    callbackErrorMessage = error.message;
  }
};
