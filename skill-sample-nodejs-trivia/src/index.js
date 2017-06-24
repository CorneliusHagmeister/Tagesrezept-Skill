"use strict";
var APP_ID = "awesome";

var APP_STATES = {
  RECIPE: "_RECIPEAMODE", // Providing the recipe.
  START: "_STARTMODE", // Entry point, start the game.
  HELP: "_HELPMODE" // The user is asking for help.
};

let recipe = {
  instructions: ["Den Käse fein reiben, die saure Sahne mit etwas Paprikapulver glatt rühren. Das Mehl in eine große Rührschüssel sieben. 50 g Käse dazu geben und mit dem Mehl mischen. Die Butter in Flocken, etwas Kreuzkümmel, Salz und Pfeffer zufügen und alles zu einem glatten Teig kneten. Dabei löffelweise 150 ml saure Sahne untermischen.",
    "Den Backofen auf 200 Grad vorheizen, das Backblech einfetten.",
    "Den Teig auf der mit Mehl bestäubten Arbeitsfläche etwa 1 cm dick ausrollen. 5 cm große Taler ausstechen und auf das Backblech legen. Die Taler mit der restlichen sauren Sahne bestreichen und mit dem verbliebenen Käse und der Petersilie bestreuen. 15 Minuten backen und noch warm servieren."
  ],
  title: "Pikante Sauerrahmtaler",
  description: "ergibt 50 Kekse Käse, saure Sahne, Paprikapulver, Weizenmehl, Kreuzkümmel, Salz und Pfeffer, Petersilie",

}
var languageString = {
  "de": {
    "translation": {
      "APP_NAME": "Kochbuch", // Be sure to change this for your skill.
      "HELP_MESSAGE": "Ich stelle dir %s Multiple-Choice-Fragen. Antworte mit der Zahl, die zur richtigen Antwort gehört. " +
        "Sage beispielsweise eins, zwei, drei oder vier. Du kannst jederzeit ein neues Spiel beginnen, sage einfach „Spiel starten“. ",
      "REPEAT_QUESTION_MESSAGE": "Wenn die letzte Frage wiederholt werden soll, sage „Wiederholen“ ",
      "ASK_MESSAGE_START": "Möchten Sie beginnen?",
      "HELP_REPROMPT": "Wenn du eine Frage beantworten willst, antworte mit der Zahl, die zur richtigen Antwort gehört. ",
      "STOP_MESSAGE": "Möchtest du weiterspielen?",
      "CANCEL_MESSAGE": "OK, dann lass uns bald mal wieder spielen.",
      "NO_MESSAGE": "OK, spielen wir ein andermal. Auf Wiedersehen!",
      "RECIPE_UNHANDLED": "Sagt eine Zahl beispielsweise zwischen 1 und %s",
      "HELP_UNHANDLED": "Sage ja, um fortzufahren, oder nein, um das Spiel zu beenden.",
      "START_UNHANDLED": "Du kannst jederzeit ein neues Spiel beginnen, sage einfach „Spiel starten“.",
      "NEW_SESSION_MESSAGE": "Willkommen beim %s. ",
      "WELCOME_MESSAGE": "Ich helfe dir das heutige Tagesrezept zu kochen." +
        "Sage einfach die Zahl, die zur richtigen Antwort passt. Fangen wir an. ",
      "ANSWER_CORRECT_MESSAGE": "Richtig. ",
      "ANSWER_WRONG_MESSAGE": "Falsch. ",
      "CORRECT_ANSWER_MESSAGE": "Die richtige Antwort ist %s: %s. ",
      "ANSWER_IS_MESSAGE": "Diese Antwort ist ",
      "TELL_QUESTION_MESSAGE": "Frage %s. %s ",
      "GAME_OVER_MESSAGE": "Du hast %s von %s richtig beantwortet. Danke fürs Mitspielen!",
      "SCORE_IS_MESSAGE": "Dein Ergebnis ist %s. ",
      "RECIPE_OF_THE_DAY_IS": "Das heutige Rezept des Tages ist ",
      "START_QUESTION": "Möchtest du direkt anfangen?"
    }
  }
};

var Alexa = require("alexa-sdk");

exports.handler = function(event, context, callback) {
  var alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  // To enable string internationalization (i18n) features, set a resources object.
  alexa.resources = languageString;
  alexa.registerHandlers(newSessionHandlers, startStateHandlers, recipeStateHandlers, helpStateHandlers);
  alexa.execute();
};

var newSessionHandlers = {
  "LaunchRequest": function() {
    this.handler.state = APP_STATES.START;
    this.emitWithState("StartGame", true);
  },
  "AMAZON.StartOverIntent": function() {
    this.handler.state = APP_STATES.START;
    this.emitWithState("StartGame", true);
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = APP_STATES.HELP;
    this.emitWithState("helpTheUser", true);
  },
  "Unhandled": function() {
    var speechOutput = this.t("START_UNHANDLED");
    this.emit(":ask", speechOutput, speechOutput);
  }
};

var startStateHandlers = Alexa.CreateStateHandler(APP_STATES.START, {
  "StartGame": function(newGame) {
    var speechOutput = newGame ? this.t("NEW_SESSION_MESSAGE", this.t("APP_NAME")) + this.t("WELCOME_MESSAGE", GAME_LENGTH.toString()) : "";

    speechOutput += this.t("RECIPE_OF_THE_DAY_IS") + recipe.title;

    var repromptText = this.t("START_QUESTION");

    speechOutput += repromptText;

    Object.assign(this.attributes, {
      "speechOutput": speechOutput,
      "repromptText": repromptText,
      "instructionsIndex": 0
    });

    // Set the current state to RECIPE mode. The skill will now use handlers defined in recipeStateHandlers
    this.handler.state = APP_STATES.RECIPE;
    this.emit(":askWithCard", speechOutput, repromptText, this.t("APP_NAME"), repromptText);
  }
});

var recipeStateHandlers = Alexa.CreateStateHandler(APP_STATES.RECIPE, {
  "AnswerIntent": function() {
    handleUserAnswer.call(this, false);
  },
  "DontKnowIntent": function() {
    handleUserGuess.call(this, true);
  },
  "AMAZON.YesIntent": function() {
handlePositiveAnswer.call(this)
  },
  "AMAZON.NoIntent": function() {
    handleNegativeAnswer.call(this)
  },
  "AMAZON.NextIntent": function() {
    deliverNextInstruction.call(this);
  },
  "AMAZON.StartOverIntent": function() {
    this.handler.state = APP_STATES.START;
    this.emitWithState("StartGame", false);
  },
  "AMAZON.RepeatIntent": function() {
    this.emit(":ask", this.attributes["speechOutput"], this.attributes["repromptText"]);
  },
  "AMAZON.HelpIntent": function() {
    this.handler.state = APP_STATES.HELP;
    this.emitWithState("helpTheUser", false);
  },
  "AMAZON.StopIntent": function() {
    this.handler.state = APP_STATES.HELP;
    var speechOutput = this.t("STOP_MESSAGE");
    this.emit(":ask", speechOutput, speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    this.emit(":tell", this.t("CANCEL_MESSAGE"));
  },
  "Unhandled": function() {
    var speechOutput = this.t("RECIPE_UNHANDLED", ANSWER_COUNT.toString());
    this.emit(":ask", speechOutput, speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in RECIPE state: " + this.event.request.reason);
  }
});

var helpStateHandlers = Alexa.CreateStateHandler(APP_STATES.HELP, {
  "helpTheUser": function(newGame) {
    var askMessage = newGame ? this.t("ASK_MESSAGE_START") : this.t("REPEAT_QUESTION_MESSAGE") + this.t("STOP_MESSAGE");
    var speechOutput = this.t("HELP_MESSAGE", GAME_LENGTH) + askMessage;
    var repromptText = this.t("HELP_REPROMPT") + askMessage;
    this.emit(":ask", speechOutput, repromptText);
  },
  "AMAZON.StartOverIntent": function() {
    this.handler.state = APP_STATES.START;
    this.emitWithState("StartGame", false);
  },
  "AMAZON.RepeatIntent": function() {
    var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
    this.emitWithState("helpTheUser", newGame);
  },
  "AMAZON.HelpIntent": function() {
    var newGame = (this.attributes["speechOutput"] && this.attributes["repromptText"]) ? false : true;
    this.emitWithState("helpTheUser", newGame);
  },
  "AMAZON.YesIntent": function() {
    if (this.attributes["speechOutput"] && this.attributes["repromptText"]) {
      this.handler.state = APP_STATES.RECIPE;
      this.emitWithState("AMAZON.RepeatIntent");
    } else {
      this.handler.state = APP_STATES.START;
      this.emitWithState("StartGame", false);
    }
  },
  "AMAZON.NoIntent": function() {
    var speechOutput = this.t("NO_MESSAGE");
    this.emit(":tell", speechOutput);
  },
  "AMAZON.StopIntent": function() {
    var speechOutput = this.t("STOP_MESSAGE");
    this.emit(":ask", speechOutput, speechOutput);
  },
  "AMAZON.CancelIntent": function() {
    this.emit(":tell", this.t("CANCEL_MESSAGE"));
  },
  "Unhandled": function() {
    var speechOutput = this.t("HELP_UNHANDLED");
    this.emit(":ask", speechOutput, speechOutput);
  },
  "SessionEndedRequest": function() {
    console.log("Session ended in help state: " + this.event.request.reason);
  }
});

function deliverPreviousInstruction() {
  Object.assign(this.attributes, {
    "instructionsIndex": this.attributes["instructionsIndex"] - 1
  });
  this.emit(":ask", recipe["instructions"][this.attributes["instructionsIndex"]]);
}

function repeatCurrentInstruction() {
  this.emit(":ask", recipe["instructions"][this.attributes["instructionsIndex"]]);
}

function deliverNextInstruction() {
  Object.assign(this.attributes, {
    "instructionsIndex": this.attributes["instructionsIndex"] + 1
  });
  if (this.attributes["instructionsIndex"] == 0) {
    this.emit(":ask", recipe["instructions"][this.attributes["instructionsIndex"] + "Sage Weiter für den nächsten Schritt. Du kannst mich auch bitten den aktuellen Schritt noch einmal zu wiederholen. Sage dazu wiederholen."]);
  } else {
    if (this.attributes["instructionsIndex"] < recipe["instructions"].length) {
      this.emit(":ask", recipe["instructions"][this.attributes["instructionsIndex"]]);
    } else {
      this.emit(":ask", recipe["instructions"][this.attributes["instructionsIndex"]] + "Das war es schon. Guten Appetit! Falls du einen Schritt nochmal wiederholen willst, bleibe ich für dich aktiv. Andernfalls kannst du mich jetzt gerne beenden.");
    }
  }
}

function handlePositiveAnswer() {
  deliverNextInstruction.call(this);
}

function handleNegativeAnswer() {
  this.emit(":tell", " Frag mich doch später nochmal");
}
