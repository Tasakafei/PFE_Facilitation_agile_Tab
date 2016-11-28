'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopListCtrl', function($scope, WorkshopsProvider) {
    $scope.workshops = {};

    WorkshopsProvider.getWorkshops(function (workshopsResult) {
        $scope.workshops = workshopsResult;
    });
});