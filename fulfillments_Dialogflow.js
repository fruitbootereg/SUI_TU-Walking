/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const {Card, Suggestion} = require('dialogflow-fulfillment');

var fallbackCounter = 0;
var welcomeCounter = 0;
var findRouteCounter = 0;
var findRouteConfirmСounter = 0;
var findRouteMisLocOrDestCounter = 0;
var findRouteMisLocOrDestRoomNCounter = 0;
var planBcounter = 0;
var planBconfirmСounter = 0;
var Enabled = true;
var Enabled_PlanB = 0;
var Enabled_PlanB_GetLocRoomN = 0;
var Enabled_PlanB_GetDestBuild = 0;
var Enabled_PlanB_GetDestRoomN = 0;
var DestBuild = ``;
var DestRoomNumber = ``;



const GENERAL_FALLBACK = [
    'Entschuldigung, das habe ich nicht richtig verstanden. Können Sie es bitte wiederholen?',
    'Können Sie bitte wiederholen?',
    'Ich verstehe Sie nicht.',
    'Ich habe das nicht richtig verstanden. Können Sie bitte wiederholen'
];
const FINAL_FALLBACK = [
    'Heute ist ein schlechter Tag für meine Spracherkennung',
    'Heute funktioniert etwas bei mir nicht. Lassen Sie uns es später noch mal versuchen.',
    'Etwas ist schief gegangen, lassen Sie es uns später noch mal versuchen...',
    'Lassen Sie uns das später nochmal versuchen.'
];
const CONFIRMATION = [
    'Heute ist ein schlechter Tag für meine Spracherkennung.',
    'Heute funktioniert etwas bei mir nicht. Lassen Sie uns es später noch mal versuchen.',
    'Etwas ist schief gegangen, lassen Sie es uns später noch mal versuchen...',
    'Lassen Sie uns das später nochmal versuchen.'
];
const THANKYOU = [
    `Gern geschehen.`,
    `Gerne.`,
    `Bitte.`,
    `Kein Problem`
];
// Import the Dialogflow module from the Actions on Google client library.
//const { dialogflow } = require('actions-on-google');

// Import the request-promise package for network requests.
//const request = require('request-promise');
// Instantiate the Dialogflow client.
//const app = dialogflow({ debug: true });


//process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });
  console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

    function welcome(agent) {
        resetCounters("welcome");

        if (welcomeCounter < 3) {
            agent.add(`Hallo, ich kann die schnellste Route von Ihrem Standort zu jedem Raum der Universität berechnen. Sagen Sie mir bitte wo Sie Sich befinden und zu welchem Raum Sie gehen wollen.`);
            welcomeCounter++;
        } else {
            agent.add("In welchem Gebäude sind Sie gerade?");
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            findRouteCounter=0;
            //Enabled = false;
            agent.setContext({
                name: 'planb',
                lifespan: 5,
                parameters:{
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                    Enabled_PlanB: Enabled_PlanB
                }
            });
            resetCounters("all");
        }
    }

    function fallback(agent) {
      resetCounters('fallback');
      const query = agent.query;
      let context = agent.getContext(`findroute-followup`);
      var Loc = context.parameters.Loc;
      var Dest = context.parameters.Dest;
      var randN = Math.floor(Math.random() * 4);
      var WrongRooms = query.match(/\b\w+\b \d+/gm); // matching each possible wrong room # "ABC 123"
      if(fallbackCounter < 2){
          if (Loc === undefined && Dest === undefined){
            agent.add(GENERAL_FALLBACK[randN]);
            fallbackCounter++;
            agent.setContext({
              name: `findroute-followup`,
              lifespan: 0,
            });
          } else if (WrongRooms !== undefined){
              if (WrongRooms.length == 2){ // if two room numbers in a query and both are wrong
//            agent.add(`Beide Räume "` + WrongRooms[0] + `" und "` + WrongRooms[1] + `" gibt es nicht im Campus. Bitte sagen Sie mir die richtigen Raumnummern`);
            agent.add(`Ich habe "` + WrongRooms[0] + `" und "` + WrongRooms[1] + `" gehört. Was ist der Stand- und Zielort?`);

          } else if (WrongRooms.length == 1) { // if only a wrong room number in a query
            agent.add(`Ich habe "` + WrongRooms[0] + `" gehört. Wiederholen Sie bitte noch mal`);
          }
          fallbackCounter++;
          }


          else {
          agent.add(GENERAL_FALLBACK[randN]);
          fallbackCounter++;
          }
      } else {

        if (Loc){
            agent.add(`Lassen Sie uns etwas anderes versuchen. Sie sind im ${Loc}. In welchem Gebäude ist der Zielort?`);
            Enabled_PlanB_GetLocRoomN = 1;
            agent.setContext({
                name: `planb-getlocroomn-followup`,
                lifespan: 5,
                parameters: {
                    Loc: Loc,
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN
                }
            });
            agent.setContext({
              name: `findroute-followup`,
              lifespan: 0,
            });
        } else if (Dest){
            agent.add(`Lassen Sie uns etwas anderes versuchen. Der Zielort ist ${Dest}. In welchem Gebäude sind Sie gerade?`);
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            agent.setContext({
                name: `planb`,
                lifespan: 5,
                parameters: {
                    Dest: Dest,
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN
                }
            });
            agent.setContext({
              name: `findroute-followup`,
              lifespan: 0,
            });
        } else {
            agent.add(`Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?`);
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            findRouteCounter=0;
            fallbackCounter=0;
            //Enabled = false;
            agent.setContext({
                name: 'planb',
                lifespan: 5,
                parameters:{
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                    Enabled_PlanB: Enabled_PlanB
                }
            });
            agent.setContext({
              name: `findroute-followup`,
              lifespan: 0,
            });
        //agent.add(FINAL_FALLBACK[randN]);
      }
      resetCounters("all");
      }
//      agent.setContext({
//          name: 'confirmation',
//          lifespan: 1,
//      });

    }

    function resetAllContexts(){
        agent.setContext({
              name: 'findroute-followup',
              lifespan: 0,
            });
        agent.setContext({
              name: 'confirmation-newparameters',
              lifespan: 0,
            });
        agent.setContext({
              name: 'findroute-missinglocordest-followup',
              lifespan: 0,
            });
        agent.setContext({
              name: 'confirmation',
              lifespan: 0,
            });
    }

    function resetPlanBContexts(){
        agent.setContext({
              name: 'planb',
              lifespan: 0,
            });
        agent.setContext({
              name: 'planb-followup',
              lifespan: 0,
            });
        agent.setContext({
              name: 'planb-getlocroomn-followup',
              lifespan: 0,
            });
        agent.setContext({
              name: 'planb-getdest-followup',
              lifespan: 0,
            });
            agent.setContext({
              name: 'planb-confirmation',
              lifespan: 0,
            });

    }

    function findRouteHandler(agent) {
        //resetPlanBContexts();
        var Enabled_PlanB = 0;
        var Enabled_PlanB_GetLocRoomN = 0;
        resetCounters('findRoute');
        const Dest = agent.parameters.Dest;
        const wrongDest = agent.parameters.wrongDest;
        const Loc = agent.parameters.Loc;
        const wrongLoc = agent.parameters.wrongLoc;
        const allRooms = agent.parameters.allRooms;
        const pattern = /\d+/;
        const AnyRoom = agent.parameters.AnyRoom;
        const query = agent.query;
        const DestBuild = agent.parameters.DestBuild;
        const LocBuild = agent.parameters.LocBuild;
        const hRooms = agent.parameters.hRooms;
        const maRooms = agent.parameters.maRooms;
        const telRooms = agent.parameters.telRooms;
        const eRooms = agent.parameters.eRooms;
        const enRooms = agent.parameters.enRooms;
        const number1 = agent.parameters.number1;
        const number2 = agent.parameters.number2;

    if (Dest && Loc) {
        agent.add(`von ${Loc} zum ${Dest}?`);
        agent.setContext({
              name: 'findroute-followup',
              lifespan: 2,
              parameters:{allRooms:Loc, Dest}
            });
    } else if (Loc) {
        if (wrongDest) {
            if (wrongDest.match(pattern) !== null) {
                var wrongDestNumber = wrongDest.match(pattern);
                if (wrongDest.match(/[Tt][Ee][Ll]/)){
                    agent.add(`Den Raum ` + wrongDestNumber + ` gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie den Zielort.`);
                } else if (wrongDest.match(/[Mm][Aa]/)){
                    agent.add(`Den Raum ` + wrongDestNumber + ` gibt es nicht im Mathegebäude. Bitte wiederholen Sie den Zielort.`);
                } else if (wrongDest.match(/[Hh][Aa]/)){
                    agent.add(`Den Raum ` + wrongDestNumber + ` gibt es nicht im Hauptgebäude. Bitte wiederholen Sie den Zielort.`);
                } else if (wrongDest.match(/[Ee][Nn]/)){
                    agent.add(`Den Raum ` + wrongDestNumber + ` gibt es nicht im EN Gebäude. Bitte wiederholen Sie den Zielort.`);
                } else if (wrongDest.match(/[Ee] [Gg]/)){
                    agent.add(`Den Raum ` + wrongDestNumber + ` gibt es nicht im E Gebäude. Bitte wiederholen Sie den Zielort.`);
                } else if (wrongDest.match(/\b\w+\b \d+/)){
                    agent.add(`Raum "` + wrongDest + `" gibt es nicht im Campus. Bitte wiederholen Sie den Zielort.`);
                } else if (wrongDest.match(/\b\w+\b/)) {
                    agent.add(`Ich habe "` + wrongDest + `" gehört. Können Sie Ihren Zielort bitte noch einmal wiederholen?`);
                }
                } else {
                    agent.add(`Ich habe "${wrongDest}" gehört. Können Sie Ihren Zielort bitte noch einmal wiederholen?`);
                }
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Loc}
                    });
            } else if (DestBuild) {
                var regex = /(?: \w+)(.+)(?=s)/g;
                var regex2 = /[H]|[Ma]|[E] |[E][N] |[Tel]/;
                var DestBuildName = DestBuild.match(regex);
                var DestBuildLetter = DestBuild.match(regex2);
                if (DestBuild && number2){
                agent.add(`Wiederholen Sie bitte Ihren Zielort folgendermaßen ${DestBuildLetter} ${number2}`);
                } else if (DestBuild == 'des Hauptgebäudes'){
                    agent.add(`Bitte sagen Sie, welchen Raum im ${DestBuildName} Sie suchen. Zum Beispiel ${DestBuildLetter} 1234.`);
                } else {
                    if (DestBuildLetter == `Tel`) {
                        DestBuildLetter = `TEL`;
                    } else if (DestBuildLetter == `Ma`) {
                        DestBuildLetter = `MA`;
                    }
                    agent.add(`Bitte sagen Sie, welchen Raum im ${DestBuildName} Sie suchen. Zum Beispiel ${DestBuildLetter} 123.`);
                }
            } else {
                var queryCheck= query.match(/\b\w+\b \d+/);
                if (query == queryCheck){
                    agent.add(`Ich glaube, dass der ` + Loc + ` Ihrer Standort ist. Zu welchem Raum soll ich die Route suchen?`);
                } else {
                    agent.add(`Ich benötige noch Ihren Zielort.`);
                    agent.setContext({
                      name: 'findroute-followup',
                      lifespan: 5,
                      parameters:{allRooms: Loc}
                    });
                }
            } /*else{
                var queryCheck= query.match(/\b\w+\b \d+/);
                if (query === queryCheck){
                agent.add(`Ich glaube, dass der Raum ` + queryCheck + ` Ihrer Standort ist. Zu welchem Raum soll ich die Route suchen?`);
                } else {
                agent.add(`Ich glaube, dass der ` + Loc + ` Ihrer Standort ist. Zu welchem Raum soll ich die Route suchen?`);
                }
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Loc}
                });
            }*/
    } else if (Dest) {
        if (wrongLoc) {
            if (wrongLoc.match(pattern) !== null) {
                var wrongLocNumber = wrongLoc.match(pattern);
                if (wrongLoc.match(/[Tt][Ee][Ll]/)){
                    agent.add(`Den Raum ` + wrongLocNumber + ` gibt es im Telefunkengebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (wrongLoc.match(/[Mm][Aa]/)){
                    agent.add(`Den Raum ` + wrongLocNumber + ` gibt es im Mathegebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (wrongLoc.match(/[Hh][Aa]/) || wrongLoc.match(/[Hh] \d+/)){
                    agent.add(`Den Raum ` + wrongLocNumber + ` gibt es im Hauptgebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (wrongLoc.match(/[Ee][Nn]/)){
                    agent.add(`Den Raum ` + wrongLocNumber + ` gibt es im EN Gebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (wrongLoc.match(/[Ee] [Gg]/)){
                    agent.add(`Den Raum ` + wrongLocNumber + ` gibt es im E Gebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (wrongLoc.match(/\b\w+\b \d+/)){
                    agent.add(`Den Raum "` + wrongLoc + `" gibt es nicht im Campus. Bitte wiederholen Sie den Standort.`);
                } else if (wrongLoc.match(/\b\w+\b/)) {
                    agent.add(`Ich habe "` + wrongLoc + `" gehört. Können Sie Ihren Standort bitte noch einmal wiederholen?`);
                }
                } else {
                    agent.add(`Ich habe "${wrongLoc}" gehört. Können Sie Ihren Standort bitte noch einmal wiederholen?`);
                }
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Dest}
                    });
        } else if (LocBuild) {
            regex = /(?: \w+)(.+)(?=s)/g;
            regex2 = /[H]|[M][a]|[E] |[E][N] |[T][e][l]/;
            var LocBuildName = LocBuild.match(regex);
            var LocBuildLetter = LocBuild.match(regex2);
            if (LocBuild && number1){
                agent.add(`Wiederholen Sie bitte Ihren Standort folgendermaßen ${LocBuildLetter} ${number1}`);
            } else if (LocBuild == 'des Hauptgebäudes'){
                agent.add(`In oder in der Nähe von welchem Raum befinden Sie sich im ${LocBuildName}? Zum Beispiel ${LocBuildLetter} 1234.`);
            } else {
                if (LocBuildLetter == `Tel`) {
                        LocBuildLetter = `TEL`;
                    } else if (LocBuildLetter == `Ma`) {
                        LocBuildLetter = `MA`;
                    }
                agent.add(`In oder in der Nähe von welchem Raum befinden Sie sich im ${LocBuildName}? Zum Beispiel ${LocBuildLetter} 123.`);
            }
        } else {
            agent.add(`Ich benötige noch Ihren Standort.`);
            agent.setContext({
              name: 'findroute-followup',
              lifespan: 5,
              parameters:{allRooms: wrongLoc, Dest}
            });
        }

    } /*else if (allRooms) {
        if (Loc) {
            agent.add(`von ${Loc} zum ${allRooms}?`);
        } else if (Dest) {
            agent.add(`von ${allRooms} zum ${Dest}?`);
        } else {
        agent.add(`Was ist das?`);
        }
    }*/ /*else if (AnyRoom) {
        agent.add(`Sagen Sie bitte "zu" oder "von" vor der Raumnummer.`);

    }*/ else if (number1 && number2||number1||number2){
        if (findRouteCounter < 3) {
            if (number1){
                agent.add(`Ich benötige eine vollständige Raumnummer, z.B. "MA ${number1}.`);
            } else if (number2){
                agent.add(`Ich benötige eine vollständige Raumnummer, z.B. "MA ${number2}.`);
            }else{
                agent.add(`Bitte sagen Sie die vollständigen Raumnummern, z.B. "von MA ${number1} nach TEL ${number2}.`);
            }
            findRouteCounter++;
        } else {
            agent.add("Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?");
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            findRouteCounter=0;
            //Enabled = false;
            agent.setContext({
                name: 'planb',
                lifespan: 5,
                parameters:{
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                    Enabled_PlanB: Enabled_PlanB
                }
            });


            resetCounters("all");
            }
    } else if (LocBuild||DestBuild){
        if (findRouteCounter < 3) {
            agent.add(`Ich benötige eine vollständige Raumnummer. Zum Beispiel H 0110.`);
            agent.setContext({
                name: `findroute-followup`,
                lifespan: 0
            });
            findRouteCounter++;
        } else {
            agent.add("Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?");
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            findRouteCounter=0;
            Enabled = false;
            agent.setContext({
                    name: 'planb',
                    lifespan: 5,
                    parameters:{
                        Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                        Enabled_PlanB: Enabled_PlanB
                    }
                });

                resetCounters("all");
            }

    } else if(wrongLoc && wrongDest){
                agent.add(`Beide Räume ${wrongLoc} und ${wrongDest} gibt es nicht. Bitte wiederholen Sie die Raumnummern`);
        agent.setContext({
                name: `findroute-followup`,
                lifespan: 0,
          });
    } else if(wrongLoc){
        agent.add(`Den Raum ${wrongLoc} gibt es nicht. Bitte wiederholen Sie die Raumnummer`);
        agent.setContext({
                name: `findroute-followup`,
                lifespan: 0,
          });
    } else if(wrongDest){
        agent.add(`Den Raum ${wrongDest} gibt es nicht. Bitte wiederholen Sie die Raumnummer`);
        agent.setContext({
                name: `findroute-followup`,
                lifespan: 0,
          });
    }

   /* else if (query.match(/\b\w+\b \d+/gm) === true){

        var WrongRooms = query.match(/\b\w+\b \d+/gm);

        if (findRouteCounter < 3) {
            if (WrongRooms.length > 1){
                agent.add(`Beide Räume ` + WrongRooms[0] + ` und ` + WrongRooms[1] + ` gibt es nicht. Bitte wiederholen Sie die Raumnummern`);

                agent.setContext({
                name: `findroute-followup`,
                lifespan: 0,
          });
            } else if (WrongRooms.length == 1) {
                if (query.match(/[Tt][Ee][Ll]/)){
                    agent.add(`Den Raum ` + WrongRooms[0] + ` gibt es im Telefunkengebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (query.match(/[Mm][Aa]/)){
                    agent.add(`Den Raum ` + WrongRooms[0] + ` gibt es im Mathegebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (query.match(/[Hh][Aa]/) || query.match(/[Hh] \d+/)){
                    agent.add(`Den Raum ` + WrongRooms[0] + ` gibt es im Hauptgebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (query.match(/[Ee][Nn]/)){
                    agent.add(`Den Raum ` + WrongRooms[0] + ` gibt es im EN Gebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else if (query.match(/[Ee] [Gg]/)){
                    agent.add(`Den Raum ` + WrongRooms[0] + ` gibt es im E Gebäude nicht. Bitte wiederholen Sie den Standort.`);
                } else {
                    agent.add(`Den Raum ` + WrongRooms[0] + ` gibt es nicht. Bitte wiederholen Sie mit der richtigen Raumnummern`);
                }
            }
            findRouteCounter++;
            agent.setContext({
              name: `findroute-followup`,
              lifespan: 5,
              parameters:{allRooms: Loc, Dest}
            });
        } else {
            agent.add("Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?");
//            findRouteCounter=0;
//            Enabled = false;
            agent.setContext({
                name: 'planb',
                lifespan: 5,
                parameters:{
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                    Enabled_PlanB: Enabled_PlanB
                }
            });
            resetCounters("all");
            agent.setContext({
              name: `findroute-followup`,
              lifespan: 0,
            });
            }
    } */

    else {
        if (findRouteCounter < 3) {
            agent.add(`Bitte sagen sie, wo Sie gerade sind und welchen Raum Sie suchen.`);
            findRouteCounter++;
        } else {
            agent.add("Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?");
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            findRouteCounter=0;
            Enabled = false;
            agent.setContext({
                    name: 'planb',
                    lifespan: 5,
                    parameters:{
                        Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                        Enabled_PlanB: Enabled_PlanB
                    }
                });

                resetCounters("all");
            }
    }
}



    function findRouteConfirmHandler(agent) {

        resetCounters('findRouteConfirm');
        let context = agent.getContext('findroute-followup');
        //let context2 = agent.getContext('confirmation-newparameters');
        const confirm = agent.parameters.confirmation;
        const something = agent.parameters.irgendwas;
        const Dest = context.parameters.Dest;
        const Loc = context.parameters.Loc;
        const newDest = context.parameters.NewDest;
        const newLoc = context.parameters.NewLoc;
        const Rooms = context.parameters.Rooms;
        const DestRooms = context.parameters.DestRooms;
        const LocRooms = context.parameters.LocRooms;
        const LocComposite = context.parameters.LocComposite;
        const DestComposite = context.parameters.DestComposite;
        const confNewLoc = agent.parameters.confNewLoc;
        const confNewDest = agent.parameters.confNewDest;

        if (confirm == 'ja') {
            if (LocComposite) {
                agent.add(`Hier ist die Route vom Raum ${LocComposite} zum ${Dest} `);
            } else if (DestComposite) {
                agent.add(`Hier ist die Route vom ${Loc} zum ${DestComposite} `);
            } else if (Loc && Rooms){
                agent.add(`Hier ist die Route vom ${Loc} zum ${Rooms} `);
            } else if (Dest && Rooms){
                agent.add(`Hier ist die Route vom ${Rooms} zum ${Dest} `);
            } else if (Loc && newDest){
                agent.add(`Hier ist die Route vom ${Loc} zum ${newDest} `);
            } else if (Dest && newLoc){
                agent.add(`Hier ist die Route vom ${newLoc} zum ${Dest} `);
            } else if (newLoc && newDest){
                agent.add(`Hier ist die Route vom ${newLoc} zum ${newDest} `);
            } else if (Rooms && DestRooms){
                agent.add(`Hier ist die Route vom ${Rooms} zum ${DestRooms} `);
            } else if (Rooms && LocRooms){
                agent.add(`Hier ist die Route vom ${LocRooms} zum ${Rooms} `);
            } else if (Loc && DestRooms){
                agent.add(`Hier ist die Route vom ${Loc} zum ${DestRooms} `);
            } else if (Dest && LocRooms){
                agent.add(`Hier ist die Route vom ${LocRooms} zum ${Dest} `);
            } else {
                agent.add(`Hier ist die Route vom ${Loc} zum ${Dest} `);
            }
            resetCounters(`all`);
            resetAllContexts();
            resetPlanBContexts();
        } else if(confirm == 'nein') {
            if (findRouteConfirmСounter < 2) {
                if (confNewLoc){
                    agent.add(`Hier ist die Route von ${confNewLoc} zum ${Dest}`);
                    resetCounters(`all`);
                    resetAllContexts();
                    resetPlanBContexts();
                } else if (confNewDest){
                    agent.add(`Hier ist die Route von ${Loc} zum ${confNewDest}`);
                    resetCounters(`all`);
                    resetAllContexts();
                    resetPlanBContexts();
                } else {
                    agent.add("Bitte sagen Sie mir noch mal Ihren Stand- und Zielort.");
                }
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 0,
                   // parameters:{allRooms: Loc, Dest}
                });
                findRouteConfirmСounter++;

            } else {
                agent.add("Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?");
                var Enabled_PlanB = 0;
                var Enabled_PlanB_GetLocRoomN = 0;
                agent.setContext({
                    name: 'planb',
                    lifespan: 5,
                    parameters:{
                        Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                        Enabled_PlanB: Enabled_PlanB
                    }
                });
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 0
                });

                resetCounters("all");
            }
        } else if (something){
            var randN = Math.floor(Math.random() * 4);
            if(fallbackCounter < 3){
                agent.add(GENERAL_FALLBACK[randN]);
                fallbackCounter++;
            } else {
                agent.add(FINAL_FALLBACK[randN]);
                console.log(randN);
                resetCounters("all");
            }
        }

    }



    function findRouteConfirmNewParamHandler(agent) {
        if (Enabled === true){
            resetCounters('findRouteConfirm');
            let context = agent.getContext('confirmation');
            const newDest = context.parameters.NewDest;
            const newLoc = context.parameters.NewLoc;

            if (newLoc && newDest) {
                agent.add(`Von ${newLoc} zum ${newDest}?`);
                agent.setContext({
                        name: 'confirmation-newparameters',
                        lifespan: 5,
                        parameters:{
                        allRooms: newDest, newLoc
                        }
                });
            }
        }
    }

    function findRouteMisLocOrDestHandler(agent) {

        resetCounters('findRouteMisLocOrDest');
        let context = agent.getContext('findroute-followup');
        const Dest = context.parameters.Dest;
        const wrongLoc = context.parameters.wrongLoc;
        const wrongDest = context.parameters.wrongDest;
        const Loc = context.parameters.Loc;
        const Rooms = agent.parameters.Rooms;
        const Building = agent.parameters.Building;
        const hRooms = agent.parameters.hRooms;
        const maRooms = agent.parameters.maRooms;
        const telRooms = agent.parameters.telRooms;
        const eRooms = agent.parameters.eRooms;
        const enRooms = agent.parameters.enRooms;
        const query = agent.query;
        const indicatorLocation = agent.parameters.IndicatorLocation;
        const direction = agent.parameters.Direction;
        const number = agent.parameters.number;
        var queryCheck= query.match(/\b\w+\b \d+/);


            if (Building && Dest) {
                agent.setContext({
                    name: 'findroute-missinglocordest-followup',
                    lifespan: 5,
                    parameters:{
                        allRooms: Dest,
                        Building: Building
                    }
                });
            agent.add(`Von welchem Raum ${Building}?`);
            } else if (Building && Loc) {
                var regex = /(?: \w+)(.+)(?=s)/g;
                var LocBuildName = Building.match(regex);
                agent.setContext({
                    name: 'findroute-missinglocordest-followup',
                    lifespan: 5,
                    parameters:{
                        allRooms: Loc,
                        Building: Building
                    }
                });
            agent.add(`Zu welchem Raum im ${LocBuildName}?`);
            } /*else if (Loc && Rooms){
                agent.add(`von ${Loc} zum ${Rooms}?`);
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Loc, Rooms}
                    });
            } else if (Dest && Rooms) {
                agent.add(`von ${Rooms} zum ${Dest}?`);
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Rooms, Dest}
                   });
            } */else if (Rooms && (Loc || Dest)){
                if (Loc && indicatorLocation){
                    agent.add(`Von ${Loc} nach ${Rooms}?`);
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Rooms}
                   });
                } else if (Dest && direction){
                    agent.add(`Von ${Rooms} nach ${Dest}?`);
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Rooms}
                    });
                } else if (Loc && Rooms){
                agent.add(`Von ${Loc} zum ${Rooms}?`);
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Loc, Rooms}
                    });
                } else if (Dest && Rooms) {
                agent.add(`Von ${Rooms} zum ${Dest}?`);
                agent.setContext({
                    name: 'findroute-followup',
                    lifespan: 5,
                    parameters:{allRooms: Rooms, Dest}
                   });
                } /*else if (Rooms) {
                    agent.add(`Ich glaube, dass der ` + Rooms + ` Ihrer Standort ist. Zu welchem Raum soll ich die Route suchen?`);
                    agent.setContext({
                    name: 'findroute-missinglocordest-followup',
                    lifespan: 5,
                    parameters:{allRooms: Rooms}
                   });
                }*/
            }
///////////////////////////Try to solve later/////////////////////////////
        /*    else if (Loc){
                if (Rooms === null){

                }
            } else if (Dest){

            } */

            else if (number){
                if (indicatorLocation){
                    agent.add(`ich habe nur "${number}" gehört. Bitte geben Sie die Raumnummer vollständig an, z.B. "von TEL ${number}"`);
                } else if (direction){
                    agent.add(`ich habe nur "${number}" gehört. Bitte geben Sie die Raumnummer vollständig an, z.B. "zu TEL ${number}"`);
                } else {
                    agent.add(`ich habe nur "${number}" gehört. Bitte geben Sie die Raumnummer vollständig an, z.B. "TEL ${number}"`);
                }
            } else if (query.match(/\b\w+\b \d+/)) {
                agent.add(`Raum "` + queryCheck + `" gibt es nicht im Campus. Bitte wiederholen Sie den Zielort.`);
            }
        }


    function findRouteMisLocOrDestRoomNHandler(agent) {
        resetCounters('findRouteMisLocOrDestRoomN');
        let context = agent.getContext('findroute-followup');
        let context2 = agent.getContext('findroute-missinglocordest-followup');
        const Dest = context.parameters.Dest;
        const Loc = context.parameters.Loc;
        const Building = context2.parameters.Building;
        const hRooms = agent.parameters.hRooms;
        const maRooms = agent.parameters.maRooms;
        const telRooms = agent.parameters.telRooms;
        const eRooms = agent.parameters.eRooms;
        const enRooms = agent.parameters.enRooms;
        const LocRooms = agent.parameters.LocRooms;
        const DestRooms = agent.parameters.DestRooms;
        const Rooms = context2.parameters.Rooms;
        var LocComposite = ``;
        var DestComposite = '';
        const query = agent.query;


        if (Building  == 'des Hauptgebäudes' && Dest) {
            if (query == hRooms) {
                agent.add(`vom Raum ${hRooms} ${Building} zum ${Dest}?`);
                LocComposite = `${hRooms} ${Building}`;
            } else if (query !== hRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Hauptgebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "H ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte finden Sie die richtige Raumnummer und dann versuchen wir noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des Mathegebäudes' && Dest) {
            if (query == maRooms) {
                agent.add(`vom Raum ${maRooms} ${Building} zum ${Dest}?`);
                LocComposite = `${maRooms} ${Building}`;
            } else if (query !== maRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im Mathegebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "MA ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des Telefunkengebäudes' && Dest) {
            if (query == telRooms) {
                agent.add(`vom Raum ${telRooms} ${Building} zum ${Dest}?`);
                LocComposite = `${telRooms} ${Building}`;
            } else if (query !== telRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "TEL ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des E Gebäudes' && Dest) {
            if (query == eRooms) {
                agent.add(`vom Raum ${eRooms} ${Building} zum ${Dest}?`);
                LocComposite = `${eRooms} ${Building}`;
            } else if (query !== eRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im E Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "E ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des EN Gebäudes' && Dest) {
            if (query == enRooms) {
                agent.add(`vom Raum ${enRooms} ${Building} zum ${Dest}?`);
                LocComposite = `${enRooms} ${Building}`;
            } else if (query !== enRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im EN Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "EN ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        }

        else if (Building == 'des Hauptgebäudes' && Loc) {
            if (query == hRooms) {
                agent.add(`von ${Loc} zu dem Raum ${hRooms} ${Building}?`);
                DestComposite = `${hRooms} ${Building}`;
                agent.setContext({
                        name: 'findroute-followup',
                        lifespan: 5,
                        parameters:{
                            DestComposite: DestComposite
                        }
                    });
            } else if (query !== hRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im Hauptgebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "H ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                    agent.setContext({
                        name: 'findroute-followup',
                        lifespan: 2,
                        parameters:{
                            DestComposite: DestComposite
                        }
                    });
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des Mathegebäudes' && Loc) {
            if (query == maRooms) {
                agent.add(`vom ${Loc} zum Raum ${maRooms} ${Building}?`);
                DestComposite = `${maRooms} ${Building}`;
            } else if (query !== maRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im Mathegebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "MA ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des Telefunkengebäudes' && Loc) {
            if (query == telRooms) {
                agent.add(`vom ${Loc} zum Raum ${telRooms} ${Building}?`);
                DestComposite = `${telRooms} ${Building}`;
            } else if (query !== telRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query}  gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "TEL ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des E Gebäudes' && Loc) {
            if (query == eRooms) {
            agent.add(`vom ${Loc} zum Raum ${eRooms} ${Building}?`);
            DestComposite = `${eRooms} ${Building}`;
            } else if (query !== eRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                agent.add(`Die Raumnummer ${query}  gibt es nicht im E Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "E ${query}".`);
                findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (Building == 'des EN Gebäudes' && Loc) {
            if (query == enRooms) {
            agent.add(`vom ${Loc} zum Raum ${enRooms} ${Building}?`);
            DestComposite = `${enRooms} ${Building}`;
            } else if (query !== enRooms) {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                agent.add(`Die Raumnummer ${query}  gibt es nicht im EN Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "EN ${query}".`);
                findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        }

        /*else if (Rooms && allRooms){
            agent.add(`Von ${Rooms} nach ${allRooms}?`);

        } else if (hRooms||telRooms||maRooms||eRooms||enRooms){
            var queryCheck= query.match(/\b\w+\b \d+/);
            agent.add(`Den Raum "` + queryCheck[0] + `" gibt es nicht im Campus. Bitte wiederholen Sie den Standort.`);
        }*/

        else if(Loc && DestRooms){
            agent.add(`Von ${Loc} nach ${DestRooms}?`);
        } else if(Dest && LocRooms){
            agent.add(`Von ${LocRooms} nach ${Dest}?`);
        }

        agent.setContext({
              name: 'findroute-followup',
              lifespan: 2,
              parameters:{
                  DestComposite: DestComposite,
                  LocComposite: LocComposite,
                  allRooms: LocRooms, DestRooms, Rooms
              }
            });
    }

    function planBcounter (num){
        if (num === 0){
            Enabled_PlanB_GetLocRoomN = 0;
            return Enabled_PlanB_GetLocRoomN;
        } else if (num == 1){
            Enabled_PlanB_GetLocRoomN = 1;
            return Enabled_PlanB_GetLocRoomN;
        } else if (num == 2){
            return Enabled_PlanB_GetLocRoomN;
        }
    }

//here we get the Location Building
    function planBHandler(agent){

        const LocBuild = agent.parameters.LocBuild;
        let context = agent.getContext('planb');
//        let context2 = agent.getContext(`findroute-followup`);
        var Dest = context.parameters.Dest;
        var Enabled_PlanB_GetLocRoomN = context.parameters.Enabled_PlanB_GetLocRoomN;
        var regex = /(?: \w+)(.+)(?=s)/g;
        var locBuildRegex = LocBuild.match(regex);
        agent.add(`${locBuildRegex}. In oder in der Nähe von welcher Raumnummer?`);
        var LocationBuilding = locBuildRegex;
        agent.setContext({
            name: 'planb-followup',
            lifespan: 10,
            parameters:{
                LocBuild: LocBuild,
                allRooms: Dest
                }
            });
        planBcounter(0);
        }

//here we get the Destination Building

    function planBgetDestHandler(agent){

        const DestBuild = agent.parameters.DestBuild;
        let context = agent.getContext(`planb-getlocroomn-followup`);
        const Loc = context.parameters.Loc;
        var regex = /(?: \w+)(.+)(?=s)/g;
        var DEST_BUILD = DestBuild.match(regex);
        agent.add(`${DEST_BUILD}. Welche Raumnummer? `);
        agent.setContext({
            name: 'planb-getdest-followup',
                lifespan: 5,
                parameters:{
                    DestBuild: DestBuild,
                    Loc: Loc
                 }
            });
        agent.setContext({
            name:'planb-followup',
            lifespan: 5
        });
        planBcounter(1);
        }

    function planBgetLocRoomNHandler(agent){
        planBcounter(2); //get the value of Enabed_PlanB_GetLocRoomN
// here we get the Destination Room Number


        if (Enabled_PlanB_GetLocRoomN > 0){

            let context = agent.getContext('planb-getdest-followup');
            let context2 = agent.getContext(`planb-getlocroomn-followup`);
            let context3 = agent.getContext(`planb-followup`);
            let context4 = agent.getContext(`planb`);
            const Loc = context2.parameters.Loc;
            const DestBuild = context.parameters.DestBuild;
            const hRooms = agent.parameters.hRooms;
            const maRooms = agent.parameters.maRooms;
            const telRooms = agent.parameters.telRooms;
            const eRooms = agent.parameters.eRooms;
            const enRooms = agent.parameters.enRooms;
            const RoomNumber = context2.parameters.RoomNumber;
            const LocBuild = context3.parameters.LocBuild;
            const planBRooms = agent.parameters.planBRooms;
            const planBRoomsLoc = context2.parameters.planBRoomsLoc;
            var DestRoomNumber = ``;
            const query = agent.query;

// if Plan B starts with known Location
        if (Loc){
        if (planBRooms) {
                agent.add(`Vom ${Loc} zum ${planBRooms}?`);
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            allRooms: planBRooms,
                            Loc: Loc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
        } else if (DestBuild == 'des Hauptgebäudes'){
            if (query == hRooms) {

                agent.add(`Vom ${Loc} zum Raum ${hRooms} ${DestBuild}?`);
                DestRoomNumber = hRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            Loc: Loc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 2) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Hauptgebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "H ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des Mathegebäudes'){
            if (query == maRooms) {
                agent.add(`Vom ${Loc} zum Raum ${maRooms} ${DestBuild}?`);
                DestRoomNumber = maRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            Loc: Loc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Mathegebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "MA ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des Telefunkengebäudes'){
            if (query == telRooms) {
                agent.add(`Vom ${Loc} zum Raum ${telRooms} ${DestBuild}?`);
                DestRoomNumber = telRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            Loc: Loc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "TEL ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des E Gebäudes'){
            if (query == eRooms) {
                agent.add(`Vom ${Loc} zum Raum ${eRooms} ${DestBuild}?`);
                DestRoomNumber = eRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            Loc: Loc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im E Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "E ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des EN Gebäudes'){
            if (query == enRooms) {
                agent.add(`Vom ${Loc} zum Raum ${enRooms} ${DestBuild}?`);
                DestRoomNumber = enRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            Loc: Loc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im EN Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "EN ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        }

 // if Plan B from the beginning
        } else {
            if (planBRooms) {
                if (planBRoomsLoc){
                    agent.add(`Vom ${planBRoomsLoc} zum ${planBRooms}?`);
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            allRooms: planBRooms,
                            planBRoomsLoc: planBRoomsLoc
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
                } else {
                agent.add(`Vom Raum ${RoomNumber} ${LocBuild} zum ${planBRooms}?`);
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            allRooms: planBRooms,
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
                }
            } else if (DestBuild == 'des Hauptgebäudes'){
            if (query == hRooms) {
                if (planBRoomsLoc){
                    agent.add(`Vom ${planBRoomsLoc} zum Raum ${hRooms} ${DestBuild}?`);
                    DestRoomNumber = hRooms;
                    agent.setContext({
                        name: 'planb-confirmation',
                            lifespan: 5,
                            parameters:{
                                DestRoomNumber: DestRoomNumber,
                                DestBuild: DestBuild,
                                planBRoomsLoc: planBRoomsLoc
                            }
                    });
                    Enabled_PlanB_GetLocRoomN = 0;
                } else{
                agent.add(`Vom Raum ${RoomNumber} ${LocBuild} zum Raum ${hRooms} ${DestBuild}?`);
                DestRoomNumber = hRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            }
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 2) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Hauptgebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "H ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des Mathegebäudes'){
            if (query == maRooms) {
                if (planBRoomsLoc){
                    agent.add(`Vom ${planBRoomsLoc} zum Raum ${maRooms} ${DestBuild}?`);
                    DestRoomNumber = maRooms;
                    agent.setContext({
                        name: 'planb-confirmation',
                            lifespan: 5,
                            parameters:{
                                DestRoomNumber: DestRoomNumber,
                                DestBuild: DestBuild,
                                planBRoomsLoc: planBRoomsLoc
                            }
                    });
                    Enabled_PlanB_GetLocRoomN = 0;
                } else{
                agent.add(`Vom Raum ${RoomNumber} ${LocBuild} zum Raum ${maRooms} ${DestBuild}?`);
                DestRoomNumber = maRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            }
            }else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Mathegebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "MA ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des Telefunkengebäudes'){
            if (query == telRooms) {
                if (planBRoomsLoc){
                    agent.add(`Vom ${planBRoomsLoc} zum Raum ${telRooms} ${DestBuild}?`);
                    DestRoomNumber = telRooms;
                    agent.setContext({
                        name: 'planb-confirmation',
                            lifespan: 5,
                            parameters:{
                                DestRoomNumber: DestRoomNumber,
                                DestBuild: DestBuild,
                                planBRoomsLoc: planBRoomsLoc
                            }
                    });
                    Enabled_PlanB_GetLocRoomN = 0;
                } else{
                agent.add(`Vom Raum ${RoomNumber} ${LocBuild} zum Raum ${telRooms} ${DestBuild}?`);
                DestRoomNumber = telRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            }
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "TEL ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des E Gebäudes'){
            if (query == eRooms) {
                if (planBRoomsLoc){
                    agent.add(`Vom ${planBRoomsLoc} zum Raum ${eRooms} ${DestBuild}?`);
                    DestRoomNumber = eRooms;
                    agent.setContext({
                        name: 'planb-confirmation',
                            lifespan: 5,
                            parameters:{
                                DestRoomNumber: DestRoomNumber,
                                DestBuild: DestBuild,
                                planBRoomsLoc: planBRoomsLoc
                            }
                    });
                    Enabled_PlanB_GetLocRoomN = 0;
                } else{
                agent.add(`Vom Raum ${RoomNumber} ${LocBuild} zum Raum ${eRooms} ${DestBuild}?`);
                DestRoomNumber = eRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            }
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im E Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "E ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (DestBuild == 'des EN Gebäudes'){
            if (query == enRooms) {
                if (planBRoomsLoc){
                    agent.add(`Vom ${planBRoomsLoc} zum Raum ${enRooms} ${DestBuild}?`);
                    DestRoomNumber = enRooms;
                    agent.setContext({
                        name: 'planb-confirmation',
                            lifespan: 5,
                            parameters:{
                                DestRoomNumber: DestRoomNumber,
                                DestBuild: DestBuild,
                                planBRoomsLoc: planBRoomsLoc
                            }
                    });
                    Enabled_PlanB_GetLocRoomN = 0;
                } else{
                agent.add(`Vom Raum ${RoomNumber} ${LocBuild} zum Raum ${enRooms} ${DestBuild}?`);
                DestRoomNumber = enRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 5,
                        parameters:{
                            DestRoomNumber: DestRoomNumber,
                            DestBuild: DestBuild,
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild
                        }
                });
                Enabled_PlanB_GetLocRoomN = 0;
            }
            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im EN Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "EN ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        }
        }
// here we get the Location Room Number

        } else {

        let context = agent.getContext('planb-followup');
        let context2 = agent.getContext(`planb`);
        const LocBuild = context.parameters.LocBuild;
        const hRooms = agent.parameters.hRooms;
        const maRooms = agent.parameters.maRooms;
        const telRooms = agent.parameters.telRooms;
        const eRooms = agent.parameters.eRooms;
        const enRooms = agent.parameters.enRooms;
        const planBRooms = agent.parameters.planBRooms;
        const Dest = context2.parameters.Dest;
        var RoomNumber = ``;
        var planBRoomsLoc = ``;
        const query = agent.query;

// if Plan B starts with a known Destination
        if (Dest){
        if (planBRooms) {
            planBRoomsLoc = planBRooms;
            agent.add(`Vom ${planBRoomsLoc} zum ${Dest}?`);
            agent.setContext({
                name: 'planb-confirmation',
                    lifespan: 5,
                    parameters:{
                        planBRoomsLoc: planBRoomsLoc,
                        Dest: Dest
                    }
            });
            Enabled_PlanB_GetLocRoomN++;
        } else if (LocBuild == 'des Hauptgebäudes'){
            if (query == hRooms) {
                agent.add(`Vom Raum ${hRooms} ${LocBuild} zum ${Dest}?`);
                RoomNumber = hRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 2,
                        parameters:{
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild,
                            Dest: Dest
                        }
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Hauptgebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "H ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }

        } else if (LocBuild == 'des Mathegebäudes'){

            if (query == maRooms) {
                agent.add(`Vom Raum ${maRooms} ${LocBuild} zum ${Dest}?`);
                RoomNumber = maRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 2,
                        parameters:{
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild,
                            Dest: Dest
                        }
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Mathegebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "MA ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (LocBuild == 'des Telefunkengebäudes'){

            if (query == telRooms) {
                agent.add(`Vom Raum ${telRooms} ${LocBuild} zum ${Dest}?`);
                RoomNumber = telRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 2,
                        parameters:{
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild,
                            Dest: Dest
                        }
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "TEL ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (LocBuild == 'des E Gebäudes'){

            if (query == eRooms) {
                agent.add(`Vom Raum ${eRooms} ${LocBuild} zum ${Dest}?`);
                RoomNumber = eRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 2,
                        parameters:{
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild,
                            Dest: Dest
                        }
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im E Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "E ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } if (LocBuild == 'des EN Gebäudes'){

            if (query == enRooms) {
                agent.add(`Vom Raum ${enRooms} ${LocBuild} zum ${Dest}?`);
                RoomNumber = enRooms;
                agent.setContext({
                    name: 'planb-confirmation',
                        lifespan: 2,
                        parameters:{
                            RoomNumber: RoomNumber,
                            LocBuild: LocBuild,
                            Dest: Dest
                        }
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im EN Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "EN ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        }
        }
// if Plan B starts from the beginning
        else {
            if (planBRooms) {
            planBRoomsLoc = planBRooms;
            agent.add(`Vom ` + planBRoomsLoc + `.In welchem Gebäude ist der Raum?`);
            agent.setContext({
                name: 'planb-getlocroomn-followup',
                    lifespan: 8,
                    parameters:{planBRoomsLoc: planBRoomsLoc}
            });
            Enabled_PlanB_GetLocRoomN++;
        }
            else if (LocBuild == 'des Hauptgebäudes'){
            if (query == hRooms) {
                agent.add(`Raum ${hRooms}. In welchem Gebäude ist der Raum?`);
                RoomNumber = hRooms;
                agent.setContext({
                    name: 'planb-getlocroomn-followup',
                        lifespan: 8,
                        parameters:{RoomNumber: RoomNumber}
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Hauptgebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "H ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }

        } else if (LocBuild == 'des Mathegebäudes'){

            if (query == maRooms) {
                agent.add(`Raum ${maRooms}. In welchem Gebäude ist der Raum?`);
                RoomNumber = maRooms;
                agent.setContext({
                    name: 'planb-getlocroomn-followup',
                        lifespan: 8,
                        parameters:{RoomNumber: RoomNumber}
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Mathegebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "MA ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (LocBuild == 'des Telefunkengebäudes'){

            if (query == telRooms) {
                agent.add(`Raum ${telRooms}. In welchem Gebäude ist der Raum?`);
                RoomNumber = telRooms;
                agent.setContext({
                    name: 'planb-getlocroomn-followup',
                        lifespan: 8,
                        parameters:{RoomNumber: RoomNumber}
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im Telefunkengebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "TEL ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } else if (LocBuild == 'des E Gebäudes'){

            if (query == eRooms) {
                agent.add(`Raum ${eRooms}. In welchem Gebäude ist der Raum?`);
                RoomNumber = eRooms;
                agent.setContext({
                    name: 'planb-getlocroomn-followup',
                        lifespan: 8,
                        parameters:{RoomNumber: RoomNumber}
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im E Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "E ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        } if (LocBuild == 'des EN Gebäudes'){

            if (query == enRooms) {
                agent.add(`Raum ${enRooms}. In welchem Gebäude ist der Raum?`);
                RoomNumber = enRooms;
                agent.setContext({
                    name: 'planb-getlocroomn-followup',
                        lifespan: 8,
                        parameters:{RoomNumber: RoomNumber}
                });
                Enabled_PlanB_GetLocRoomN++;

            } else {
                if (findRouteMisLocOrDestRoomNCounter < 3) {
//                    agent.add(`Die Raumnummer ${query} gibt es nicht im EN Gebäude. Bitte wiederholen Sie noch einmal die Raumnummer.`);
                    agent.add(`Wiederholen Sie bitte die Raumnummer folgendermaßen: "EN ${query}".`);
                    findRouteMisLocOrDestRoomNCounter++;
                } else {
                    agent.add(`Bitte prüfen Sie die Raumnummer und dann versuchen wir es noch mal. Bis dann.`);
                    resetCounters("all");
                }
            }
        }
        }
    }
    }

    function planBconfirmHandler(agent) {
        resetCounters(`planBconfirm`);
        let context = agent.getContext(`planb-followup`);
        let context2 = agent.getContext(`planb-getlocroomn-followup`);
        let context3 = agent.getContext('planb-getdest-followup');
        let context4 = agent.getContext('planb-confirmation');
        let context5 = agent.getContext('findroute-followup');
        const confirm = agent.parameters.confirmation;
//        const LocBuild = context.parameters.LocBuild;
        const RoomNumber = context4.parameters.RoomNumber;
//        const DestBuild = context3.parameters.DestBuild;
        const DestRoomNumber = context4.parameters.DestRoomNumber;
        const Loc = context4.parameters.Loc;
        const Dest = context4.parameters.Dest;
        const planBRoomsDest = context4.parameters.planBRooms;
        const planBRoomsLoc = context4.parameters.planBRoomsLoc;

        if (confirm == `ja`){
            if (Loc){
                if (planBRoomsDest){
                    agent.add(`Hier ist die Route vom ${Loc} zum ${planBRoomsDest}.`);
                } else{
                    const DestBuild = context3.parameters.DestBuild;
                    agent.add(`Hier ist die Route vom ${Loc} zum Raum ${DestRoomNumber} ${DestBuild}.`);
                }
            } else if (Dest){
                if (planBRoomsLoc){
                    agent.add(`Hier ist die Route vom ${planBRoomsLoc} zum ${Dest}.`);
                } else{
                    const LocBuild = context.parameters.LocBuild;
                    agent.add(`Hier ist die Route vom Raum ${RoomNumber} ${LocBuild} zum ${Dest}.`);
                }

            } else if (planBRoomsLoc && planBRoomsDest){
                agent.add(`Hier ist die Route vom ${planBRoomsLoc} zum ${planBRoomsDest}.`);
            } else if (planBRoomsDest) {
                const LocBuild = context.parameters.LocBuild;
                agent.add(`Hier ist die Route vom Raum ${RoomNumber} ${LocBuild} zum ${planBRoomsDest}.`);
            } else if (planBRoomsLoc) {
                const DestBuild = context3.parameters.DestBuild;
                agent.add(`Hier ist die Route vom ${planBRoomsLoc} zum Raum ${DestRoomNumber} ${DestBuild}.`);
            } else {
                const LocBuild = context.parameters.LocBuild;
                const DestBuild = context3.parameters.DestBuild;
                agent.add(`Hier ist die Route vom Raum ${RoomNumber} ${LocBuild} zum Raum ${DestRoomNumber} ${DestBuild}.`);
            }
            } else {
                agent.add(`Es tut mir sehr leid, ich kann leider weiter nicht helfen. Wenn Sie trotzdem noch mal versuchen möchten, sagen Sie wo Sie sind und welchen Raum Sie suchen.`);


            }
            resetPlanBContexts();
            resetCounters("all");
    }

    function resetCounters(except) {
        if (except == 'fallback') {
            welcomeCounter = 0;
            findRouteMisLocOrDestCounter = 0;
            findRouteMisLocOrDestRoomNCounter = 0;
        } else if (except == 'welcome') {
            fallbackCounter = 0;
            findRouteCounter = 0;
            findRouteConfirmСounter = 0;
            findRouteMisLocOrDestCounter = 0;
            findRouteMisLocOrDestRoomNCounter = 0;
        } else if (except == 'findRoute'){
            fallbackCounter = 0;
            welcomeCounter = 0;
            findRouteMisLocOrDestRoomNCounter = 0;
            findRouteMisLocOrDestRoomNCounter = 0;
            planBconfirmСounter = 0;
        } else if (except === 'findRouteConfirm') {
            welcomeCounter = 0;
            findRouteCounter = 0;
            fallbackCounter = 0;
            findRouteMisLocOrDestRoomNCounter = 0;
        } else if (except === 'findRouteMisLocOrDest') {
            welcomeCounter = 0;
            findRouteCounter = 0;
            fallbackCounter = 0;
            findRouteConfirmСounter = 0;
        } else if (except === 'findRouteMisLocOrDestRoomN') {
            welcomeCounter = 0;
            findRouteCounter = 0;
            fallbackCounter = 0;
            findRouteConfirmСounter = 0;
        } else if(except === `planBconfirm`){
            welcomeCounter = 0;
            findRouteCounter = 0;
            fallbackCounter = 0;
            findRouteConfirmСounter = 0;
        } else if (except === 'all') {
            welcomeCounter = 0;
            findRouteCounter = 0;
            fallbackCounter = 0;
            findRouteConfirmСounter = 0;
            findRouteMisLocOrDestCounter = 0;
            findRouteMisLocOrDestRoomNCounter = 0;
        }
    }

    function hilfe(agent) {
      if (findRouteCounter < 3) {
            agent.add(`Welche Hilfe kann ich Ihnen anbieten?`);
            findRouteCounter++;
        } else {
            agent.add("Lassen Sie uns etwas anderes versuchen. In welchem Gebäude sind Sie gerade?");
            Enabled_PlanB = 0;
            Enabled_PlanB_GetLocRoomN = 0;
            findRouteCounter=0;
            //Enabled = false;
            agent.setContext({
                name: 'planb',
                lifespan: 5,
                parameters:{
                    Enabled_PlanB_GetLocRoomN: Enabled_PlanB_GetLocRoomN,
                    Enabled_PlanB: Enabled_PlanB
                }
            });

            resetCounters("all");
            resetPlanBContexts();
            }
    }

    function thankYou(agent){
        var randN = Math.floor(Math.random() * 4);
        agent.add(THANKYOU[randN]);
        resetCounters("all");
        resetAllContexts();
        resetPlanBContexts();
    }

    function restart(agent){
        agent.add(`Gut, lassen Sie uns noch mal anfangen. Wo sind Sie und welchen Raum Suchen Sie?`);
        resetCounters("all");
        resetAllContexts();
        resetPlanBContexts();
    }

  let intentMap = new Map();
  intentMap.set('Welcome', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  intentMap.set('Find Route', findRouteHandler);
  intentMap.set('Find Route - Confirmation', findRouteConfirmHandler);
  intentMap.set('Find Route - Confirmation - NewParameters', findRouteConfirmNewParamHandler);
  intentMap.set('Find Route - MissingLocOrDest', findRouteMisLocOrDestHandler);
  intentMap.set('Find Route - MissingLocOrDest - RoomN', findRouteMisLocOrDestRoomNHandler);
  intentMap.set('Plan B', planBHandler);
  intentMap.set('Plan B - getLocRoomN', planBgetLocRoomNHandler);
  intentMap.set('Plan B - getDest', planBgetDestHandler);
  //intentMap.set('Plan B - getDestRoomN', planBgetDestRoomNHandler);
  intentMap.set('Plan B - Confirm', planBconfirmHandler);
  intentMap.set(`Hilfe`, hilfe);
  intentMap.set(`Thank you`, thankYou);
  intentMap.set(`Neustarten`, restart);

  agent.handleRequest(intentMap);
});

 // Set the DialogflowApp object to handle the HTTPS POST request.
//exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
