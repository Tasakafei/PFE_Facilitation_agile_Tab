// AngularJS socket.io wrapper
var app = angular.module('socketio.service', []);
app.service('socket', function ($rootScope, $http) {
     var socket;
    $http.get('connection.properties').then(function (response) {
        var socketioURL = response.data.serverURL;
        socket = io.connect(socketioURL);
    });
    //var socket = io.connect("https://pfe-facilitation.herokuapp.com");
    //var socket = io.connect("http://localhost:3000");

    this.on = function (eventName, callback) {
        socket.on(eventName, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                callback.apply(socket, args);
            });
        });
    };

    this.emit = function (eventName, data, callback) {
        socket.emit(eventName, data, function () {
            var args = arguments;
            $rootScope.$apply(function () {
                if (callback) {
                    callback.apply(socket, args);
                }
            });
        })
    };
});