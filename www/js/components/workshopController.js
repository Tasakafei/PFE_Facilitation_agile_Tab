'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopCtrl', function($scope, $stateParams, socket, TimerService, WorkshopsProvider) {
    $scope.workshop = {};
    $scope.timerIsSync = null;
    $scope.workshopRunning = false;

    WorkshopsProvider.getWorkshopById($stateParams.workshopId, function (workshopResult) {
        $scope.workshop = workshopResult;

        $scope.workshopSteps = [10,20,10]; // mocked
        $scope.roundNum = 0; // first iteration
        TimerService.initializeTimer($scope.workshopSteps[$scope.roundNum]);
    });


    // Used to join the wanted room
    $scope.synchronizeTimer = function(){
        socket.emit('join_room', $scope.roomId);
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

    // initialize the timer for time value and workshop id (for socket.io)
    /*$scope.initializeTimer = function(val, workshop) {
        TimerService.initializeTimer(val);
        $scope.roomId = workshop;
    };*/

    // TODO : remove hardcoded time
    //$scope.initializeTimer(3, "roomTest");

    // wrap the start function for syncing
    /*$scope.startSyncTimer = function() {
        if(timerIsSync) {
            var timerInfo = {"workshop":$scope.roomId,"duration":$scope.timeForTimer};
            socket.emit('launch_timer', timerInfo);
            TimerService.startTimer();
        } else {
            alert("Sync please !");
        }
    };

    // wrap the resume function for syncing
    $scope.resumeSyncTimer = function() {
        socket.emit('resume_timer', $scope.roomId);
        TimerService.startTimer();
    };

    // wrap the stop and reset function for syncing
    $scope.stopSyncTimer = function(closingModal) {
        socket.emit('stop_timer', $scope.roomId);
        TimerService.stopTimer(closingModal);
    };

    // wrap the pause function for syncing
    $scope.pauseSyncTimer = function() {
        socket.emit('pause_timer', $scope.roomId);
        TimerService.pauseTimer();
    };*/

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