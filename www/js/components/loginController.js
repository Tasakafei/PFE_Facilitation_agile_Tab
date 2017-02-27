'use strict';

var app = angular.module('facilitation');

app.controller('LoginCtrl', function($scope, $state, Auth) {

    $scope.error = {};
    $scope.profile = {};
    $scope.user = {};

    $scope.logIn = function() {
        Auth.login('password', {
                'email': $scope.user.email,
                'password': $scope.user.password
            },
            function(err) {
                $scope.errors = {};

                if (!err) {
                    $state.go('tab.agenda');
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