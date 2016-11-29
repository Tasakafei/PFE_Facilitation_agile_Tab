'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopCtrl', function($scope, $stateParams, socket, TimerService, WorkshopsProvider) {
    $scope.workshop = {};
    $scope.timerIsSync = null;
    $scope.workshopRunning = false;

    WorkshopsProvider.getWorkshopById($stateParams.workshopId, function (workshopResult) {
        $scope.workshop = workshopResult.data;

        $scope.workshopSteps = filterWorkshopSteps(workshopResult.data); //[10,20,10]; // mocked
        $scope.roundNum = 0; // first iteration
        TimerService.initializeTimer($scope.workshopSteps[$scope.roundNum]);
    });

    function filterWorkshopSteps(workshop){
        return workshop.steps.map(function (step) {
            if(step.duration != undefined && step.duration.theorical != undefined) return step.duration.theorical * 60;
            else return 0;
        });
    };

    // Used to join the wanted room
    $scope.synchronizeTimer = function(){
        socket.emit('join_room', $scope.workshop._id);
    };

    $scope.startWorkshop = function () {
        if($scope.timerIsSync) {
            var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
            socket.emit('launch_timer', timerInfo);
            TimerService.startTimer();
            $scope.workshopRunning = true;
        } else {
            alert("Sync please !");
        }
    };

    socket.on('new_user', function(msg){
        $scope.timerIsSync = true;
        // TODO : testing only, to remove
        alert(msg);
    });

    $scope.$on('timer-stopped', function(event, remaining) {
        if (remaining === 0) {
            $scope.roundNum++;
            if($scope.roundNum < $scope.workshopSteps.length){
                TimerService.initializeTimer($scope.workshopSteps[$scope.roundNum]);
                $scope.startWorkshop();
            } else {
                $scope.done = true;
            }
        }
    });

    // This function helps to display the time in a correct way in the center of the timer
    $scope.humanizeDurationTimer = function(input, units) {
        return TimerService.humanizeDurationTimer(input, units);
    };
});