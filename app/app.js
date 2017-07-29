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
 */

var speechText;
var callbackErrorMessage;

/**
 * The callback to prepare a segment for play.
 * @param  {string} trigger The trigger type of a segment.
 * @param  {object} args    The input arguments.
 */
da.segment.onpreprocess = function(trigger, args) {
  console.log("[SpeechToText] onpreprocess", { trigger: trigger, args: args });
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
  console.log("[SpeechToText] onstart", { trigger: trigger, args: args });
  var synthesis = da.SpeechSynthesis.getInstance();

  synthesis.speak(
    "Welcome to npedia. What would you like to learn about? Use a single word, like 'aviation'.",
    {
      onstart: function() {
        console.log("[SpeechToText] speak onstart");
      },
      onend: function() {
        console.log("[SpeechToText] speak onend");

        var speechToText = new da.SpeechToText();
        speechToText.startSpeechToText(callbackobject);
      },
      onerror: function(error) {
        console.log("[SpeechToText] speak cancel: " + error.message);
        da.stopSegment();
      }
    }
  );
};

/**
 * The callback to resume a segment for play.
 */
da.segment.onresume = function() {
  console.log("[SpeechToText] onresume");
  var synthesis = da.SpeechSynthesis.getInstance();
  if (0 <= speechText.indexOf("stop")) {
    synthesis.speak("bye bye.", {
      onstart: function() {
        console.log("[SpeechToText] speak onstart");
      },
      onend: function() {
        console.log("[SpeechToText] speak onend");
        da.stopSegment();
      },
      onerror: function(error) {
        console.log("[SpeechToText] speak cancel: " + error.message);
        da.stopSegment();
      }
    });
    return;
  }

  var synthesis = da.SpeechSynthesis.getInstance();
  if (speechText != "") {
    console.log("sppechText is", speechText);
    var url = "https://en.wikipedia.org/api/rest_v1/page/html/" + speechText;
    console.log(url);
    $.ajax({
      url: url,
      xhr: function() {
        return da.getXhr();
      },
      type: "GET",
      // dataType: "xml",
      success: function(data, textStatus, jqXHR) {
        var article = $(data).text();
        console.log("Wikipedia response:" + article);
        synthesis.speak(article, {
          onstart: function() {
            console.log("[SpeechToText] speak onstart");
          },
          onend: function() {
            console.log("[SpeechToText] speak onend");
            da.stopSegment();
          },
          onerror: function(error) {
            console.log("[SpeechToText] speak cancel: " + error.message);
            da.stopSegment();
          }
        });
      },
      error: function(jqXHR, textStatus, errorThrown) {
        da.startSegment(null, { args: { error: "there was an error" } });
      }
    });
  } else {
    synthesis.speak(
      "The speech to text API could not recognize what you said. Reason is " +
        callbackErrorMessage,
      {
        onstart: function() {
          console.log("[SpeechToText] error message speak start");
        },
        onend: function() {
          console.log("[SpeechToText] error message speak onend");
          da.stopSegment();
        },
        onerror: function(error) {
          console.log(
            "[SpeechToText] error message speak cancel: " + error.message
          );
          da.stopSegment();
        }
      }
    );
  }
};

/**
 * The callback to get result from SpeechToText api.
 *
 * @type {{onsuccess: callbackobject.onsuccess, onerror: callbackobject.onerror}}
 */
var callbackobject = {
  onsuccess: function(results) {
    console.log(
      "[SpeechToText] : SpeechToText process has finished successfully"
    );
    console.log("[SpeechToText] : Results = " + results);

    speechText = results.join(" ");
    callbackErrorMessage = "";
  },
  onerror: function(error) {
    console.log(
      "[SpeechToText] : SpeechToText error message = " + error.message
    );
    console.log("[SpeechToText] : SpeechToText error code = " + error.code);

    speechText = "";
    callbackErrorMessage = error.message;
  }
};
