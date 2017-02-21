'use strict';

var app = angular.module('facilitation');

app.controller('LoginCtrl', function($scope, $state, Auth) {

    $scope.error = {};
    $scope.profile = {};
    $scope.user = {};

    $scope.fakeLogIn = function () {
        if($scope.user.login != undefined && $scope.user.password != undefined){
            Auth.fakeLogin($scope.user, function () {
                $state.go('tab.agenda');
            });
        }
    };

    $scope.logIn = function() {
        Auth.login('password', {
                'email': $scope.user.email,
                'password': $scope.user.password
            },
            function(err) {
                $scope.errors = {};

                if (!err) {
                    //$location.path('/');

                    alert('Vous avez bien été connecté !');
                    /*$scope.$emit('notify', {
                        type: 'success',
                        title: 'Vous avez bien été connecté !'
                    });*/

                    //Redirection with notif
                    // TODO : Replace hardcoded url
                    window.location.replace("http://localhost:8100/#/tab/workshops");

                } else {
                    angular.forEach(err.errors, function(error, field) {
                        console.log("ERROR : " + error + " : "+ field);
                    });
                    $scope.error.other = err.message;

                    alert('Impossible de se connecter.');
                }
            });
    }
});