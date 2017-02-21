'use strict';

var app = angular.module('facilitation');

app.controller('AgendaCtrl', function($scope) {
    $scope.calendar = {};
    $scope.calendar.mode = 'week';

    var d1 = new Date();
    var d2 = new Date(d1);
    d2.setHours(d1.getHours() + 2);
    $scope.eventSource = [{
        title:"test",
        startTime:d1,
        endTime:d2,
        allDay:false
    }];
});