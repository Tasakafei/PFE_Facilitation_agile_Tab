'use strict';

var app = angular.module('facilitation');

app.controller('AgendaCtrl', function($scope, WorkshopsProvider) {

    $scope.workshops = {};

    $scope.calendar = {};
    $scope.calendar.mode = 'week';

    $scope.weekviewNormalEventTemplateUrl = "../../templates/agendaEvent.html";
    $scope.startingDayWeek = 0;//new Date().getDay();

    WorkshopsProvider.getEvents(function (events) {
        $scope.eventSource = [];
        $scope.workshops = events.data;

        events.data.forEach(function (event) {
            var dateStart = new Date(event.begin_at);
            var dateEnd = new Date(dateStart);
            dateEnd.setMinutes(dateStart.getMinutes() + event.duration);

            var calendarEvent = {
                title:event.title,
                startTime:dateStart,
                endTime:dateEnd,
                allDay:false
            };

            $scope.eventSource.push(calendarEvent);
        });
    });

    $scope.makeCalendarClickable = function () {
        var tables = Array.from(document.getElementsByClassName("weekview-normal-event-table"));

        tables.forEach(function (table) {
            for (var i = 0; i < table.rows.length; i++) {
                for (var j = 0; j < table.rows[i].cells.length; j++) {
                    table.rows[i].cells[j].setAttribute("onclick","goToDetailedDay("+(j-1)+")");
                }
            }
        });
    };
})

// This allows to executes a function after the rendering of the specified element
// TODO : uses a $timeout...
.directive('afterRender', ['$timeout', function ($timeout) {
    var def = {
        restrict: 'A',
        terminal: true,
        transclude: false,
        link: function (scope, element, attrs) {
            $timeout(scope.$eval(attrs.afterRender), 0);
        }
    };
    return def;
}]);