/**
 * Created by user on 28/11/16.
 */

'use strict';

var app = angular.module('facilitation');
app.service('WorkshopsProvider', function ($http) {

    var host;
    var defaultUser = 'Sauvage';
    /*$http.get('connection.properties').then(function (response) {
        host = response.data.serverURL;
    });*/

    delete $http.defaults.headers.common['X-Requested-With'];
    this.getWorkshops = function (callback) {
        $http({
            method: 'GET',
            url: 'http://localhost:3000/users/unauth/Sauvage/instances'
        }).then(function successCallback(data) {
            var mockedWorkshop = {"_id":"roomTest","title":"Test Workshop","__v":0,"content":{"participants_profil":[],"logistics":[],"equipment":"<ul><li>TEST</li> </ul>","educational_aims":["Test"],"folklore":"Test","source":"http://availagility.co.uk/2011/07/19/running-the-ball-flow-game/","steps":[{"title":"Intro","timing":0,"duration":1,"_id":"583c255cecff901bffdb5102","description":"Test."},{"title":"Round #1","timing":1,"duration":1,"_id":"583c255cecff901bffdb5101","description":"<ul><li>Test</li></ul>"},{"title":"Round #2","timing":2,"duration":1,"_id":"583c255cecff901bffdb5100","description":"<ul><li>Test</li></ul>"},{"timing":3,"_id":"583c255cecff901bffdb50fb","description":"<center><b>Fin de l’atelier</b></center>"}]},"preparation_time":1,"synopsis":"Test","time_max":4,"time_min":4,"public_targeted":"Tous","participants_min":3,"participants_max":-1,"goals":[],"workshop_type":"Test","photo":"http://localhost:3000/img/atelier2.jpg","author":"Test"};

            data.data.data.push(mockedWorkshop);

            callback(data.data);
        }, function errorCallback(error) {
            alert("error : echec de la récupération des instances !  "+JSON.stringify(error));
        });
    };

    delete $http.defaults.headers.common['X-Requested-With'];
    this.getWorkshopById = function(idWorkshop, callback){
        $http({
            method: 'GET',
            url: 'http://localhost:3000/users/unauth/Sauvage/instances/'+idWorkshop
        }).then(function successCallback(data) {
            callback(data.data);
        }, function errorCallback(error) {
            if(idWorkshop == 'roomTest') callback({"status":"success","data":{"_id":"roomTest","workshopId":"583d82322bb5ef2def8460ec","status":"CREATED","nbParticipants":0,"title":"Instance de l'atelier Test Workshop","__v":0,"steps":[{"title":"Intro","description":"Test","_id":"583d82592bb5ef2def84610b","duration":{"theorical":2,"practical":-1},"timing":{"theorical":0,"practical":-1}},{"title":"Round #1","description":"<ul><li>Test</li></ul>","_id":"583d82592bb5ef2def84610c","duration":{"theorical":3,"practical":-1},"timing":{"theorical":2,"practical":-1}},{"title":"Round #2","description":"<ul><li>Test</li></ul>","_id":"583d82592bb5ef2def84610d","duration":{"theorical":4,"practical":-1},"timing":{"theorical":5,"practical":-1}},{"title":"Débrief","description":"<ul><li>Test</li></ul>","_id":"583d82592bb5ef2def846111","duration":{"theorical":6,"practical":-1},"timing":{"theorical":9,"practical":-1}},{"description":"<center><b>Fin de l’atelier</b></center>","_id":"583d82592bb5ef2def846112","duration":{"practical":-1},"timing":{"theorical":15,"practical":-1}}],"photos":[],"feedbacks":{"facilitators":[],"participants":[]},"facilitators":[{"name":"Sauvage","_id":"583d824b2bb5ef2def8460fd"}]}});
            else alert("error : echec de la récupération de l'instance !  "+JSON.stringify(error));
        });
    };
});