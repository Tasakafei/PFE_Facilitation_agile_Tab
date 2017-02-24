/**
 * Created by user on 28/11/16.
 */

'use strict';

var app = angular.module('facilitation');
app.service('WorkshopsProvider', function ($http) {

    var host;

    delete $http.defaults.headers.common['X-Requested-With'];
    this.getWorkshops = function (callback) {
        $http.get('connection.properties').then(function (response) {
            host = response.data.serverURL;
            $http({
                method: 'GET',
                url:host+'/users/instances',
                headers: {
                    'Content-Type': 'application/json'
                }
                //url: host+ '/users/unauth/'+$rootScope.currentUser.login+'/instances'
            }).then(function successCallback(data) {
                //console.log("getWorkshops data : "+JSON.stringify(data));
                callback(data.data);
            }, function errorCallback(error) {
                alert("error : echec de la récupération des instances !  "+JSON.stringify(error));
            });
        });


    };

    delete $http.defaults.headers.common['X-Requested-With'];
    this.getWorkshopById = function(idWorkshop, callback){
        $http.get('connection.properties').then(function (response) {
            host = response.data.serverURL;
            $http({
                method: 'GET',
                url:host+'/users/instances/'+idWorkshop,
                headers: {
                    'Content-Type': 'application/json'
                }
                //url: host+'/users/unauth/'+$rootScope.currentUser.login+'/instances/'+idWorkshop
            }).then(function successCallback(data) {
                //console.log("getWorkshops data : "+JSON.stringify(data));
                callback(data.data);
            }, function errorCallback(error) {
                alert("error : echec de la récupération de l'instance !  "+JSON.stringify(error));
            });
        });
    };

    delete $http.defaults.headers.common['X-Requested-With'];
    this.getEvents = function(callback){
        $http.get('connection.properties').then(function (response) {
            host = response.data.serverURL;
            $http({
                method: 'GET',
                url:host+'/users/events',
                headers: {
                    'Content-Type': 'application/json'
                }
                //url: host+'/users/unauth/'+$rootScope.currentUser.login+'/instances/'+idWorkshop
            }).then(function successCallback(data) {
                callback(data.data);
            }, function errorCallback(error) {
                alert("error : echec de la récupération des events !  "+JSON.stringify(error));
            });
        });
    };

    delete $http.defaults.headers.common['X-Requested-With'];
    this.getEventsByDay = function(dayNumber, callback){
        $http.get('connection.properties').then(function (response) {
            host = response.data.serverURL;
            $http({
                method: 'GET',
                url:host+'/users/events',
                headers: {
                    'Content-Type': 'application/json'
                }
                //url: host+'/users/unauth/'+$rootScope.currentUser.login+'/instances/'+idWorkshop
            }).then(function successCallback(data) {
                var events = data.data.data;
                var dayEvents = [];

                events.forEach(function (event) {
                    if(new Date(event.begin_at).getDay() == dayNumber){
                        dayEvents.push(event);
                    }
                });

                callback(dayEvents);
            }, function errorCallback(error) {
                alert("error : echec de la récupération des events !  "+JSON.stringify(error));
            });
        });
    };

    delete $http.defaults.headers.common['X-Requested-With'];
    this.sendDoneWorkshop = function (doneWorkshop, callback) {
        $http.get('connection.properties').then(function (response) {
            host = response.data.serverURL;

            // Clean data to match what's expected from the server
            // TODO (should be controlled, not only cleaned)
            doneWorkshop.steps.forEach(function (step) {
                delete step.duration.practicalMinutesDisplay;
                delete step.skiped;
            });

            $http.put(host+'/users/instances/'+doneWorkshop._id, doneWorkshop)
                .then(function successCallback(data) {
                    callback(data);
                },function errorCallback(error) {
                    callback(error);
                });
        });
    }
});