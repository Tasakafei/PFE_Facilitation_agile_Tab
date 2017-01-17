'use strict';

var app = angular.module('facilitation');

app.controller('WorkshopCtrl', function($scope, $stateParams, $ionicLoading, $interval, socket, TimerService, WorkshopsProvider) {
    $scope.workshop = {};
    $scope.timerIsSync = null;
    $scope.iterationRunning = false;
    $scope.workshopRunning = false;
    $scope.doneWorkshop = false;
    $scope.isLate = false;


    var timerInterval, globalTimerInterval, ispaused = false;


    // Automatically retrieve the workshop instance when arriving in this controller
    WorkshopsProvider.getWorkshopById($stateParams.workshopId, function (workshopResult) {
        $scope.workshop = workshopResult.data;

        $scope.workshopStepsDuration = filterWorkshopDurationSteps(workshopResult.data).filter(function (duration) {return duration > -1;});
        $scope.overallTime = $scope.workshopStepsDuration.reduce(function (a, b) {return a+b;});
        $scope.roundNum = 0; // first iteration
        $scope.currentStep = $scope.workshop.steps[$scope.roundNum];
        if($scope.workshop.steps[$scope.roundNum+1] != undefined)
            $scope.nextStep = $scope.workshop.steps[$scope.roundNum+1];
        else
            $scope.nextStep = "";
        initializeIterationTimer($scope.workshopStepsDuration[$scope.roundNum]);
        initializeGlobalTimer($scope.overallTime);
    });

    // Filter the steps to retrieve only the durations
    function filterWorkshopDurationSteps(workshop){
        return workshop.steps.map(function (step) {
            if(step.duration != undefined && step.duration.theorical != undefined) return step.duration.theorical * 60;
            else return -1;
        });
    };

    // Used to join the wanted instance
    $scope.synchronizeTimer = function(){
        console.log("Join room : "+$scope.workshop._id);
        socket.emit('join_room', $scope.workshop._id);
    };

    // Ensure that the timer is synchronized
    socket.on('join_success', function(msg){
        $scope.timerIsSync = true;
        $ionicLoading.show({ template: msg, noBackdrop: true, duration: 2000 });
    });

    // Used to leave the instance when destroying (leaving) this controller
    $scope.$on("$destroy", function(){
        console.log("Leave room : "+$scope.workshop._id);
        socket.emit('leave_room', $scope.workshop._id);
        endOfWorkshop();
    });

    // TODO : MOVE TO SERVICE ?

    // Initialize the values for the iteration timer (plugin dependent)
    function initializeIterationTimer(val) {
        $scope.timeForTimer = val;
        $scope.timer = val;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
    };

    // Initialize the value(s) for the global timer
    function initializeGlobalTimer(val) {
        $scope.globalTimer = val;
        $scope.isLate = false;
    }

    function endOfWorkshop() {
        $scope.doneWorkshop = true;
        $scope.workshopRunning = false;
        $scope.iterationRunning = false;
        $scope.roundNum = 0;
        stopGlobalTimer();
        initializeIterationTimer(0);
    }

    // Launch the instance
    $scope.startIteration = function () {
        if($scope.timerIsSync) {
            var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
            socket.emit('launch_timer', timerInfo);
            $scope.startTimer();
            if($scope.workshopRunning == false) {
                runGlobalTimer();
                $scope.workshopRunning = true;
            }
            $scope.iterationRunning = true;
        } else {
            alert("Sync please !");
        }
    };

    $scope.startTimer = function () {
        ispaused = false;
        $scope.started = true;
        if(angular.isDefined(timerInterval)) return;
        runIterationTimer();
    };

    $scope.pauseTimer = function () {
        ispaused = true;
        $scope.started = false;
        $scope.paused = true;
        stopIterationTimer(false);
    };

    $scope.resumeTimer = function(){
        if(!ispaused) return;
        ispaused = false;
        runIterationTimer();
    };

    $scope.resetTimer = function(){
        ispaused = false;
        stopIterationTimer(false);
        $scope.timer = $scope.timeForTimer;
        $scope.started = false;
        $scope.paused = false;
        $scope.done = false;
    };

    $scope.increaseTimer = function (amount) {
        stopIterationTimer(false);
        $scope.timer += amount;
        $scope.timeForTimer = $scope.timer;
        var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
        socket.emit('restart_timer', timerInfo);
        runIterationTimer();
    };

    $scope.decreaseTimer = function (amount) {
        stopIterationTimer(false);
        var timerVal = $scope.timer - amount;
        if(timerVal < 0) timerVal = 0;
        $scope.timer = timerVal;
        $scope.timeForTimer = $scope.timer;
        var timerInfo = {"workshop":$scope.workshop._id,"duration":$scope.timeForTimer};
        socket.emit('restart_timer', timerInfo);
        runIterationTimer();
    };

    function runIterationTimer(){
        timerInterval = $interval(function(){
            $scope.timer--;
            // TODO : Check if that fix is not totally shitty
            if($scope.timer == -1) stopIterationTimer(true);
        }, 1000);
    };

    function stopIterationTimer(continueToNextIteration) {
        if (angular.isDefined(timerInterval)) {
            $interval.cancel(timerInterval);
            timerInterval = undefined;
            if(continueToNextIteration) nextIteration();
        }
    };

    function nextIteration(){
        $scope.roundNum++;
        if($scope.roundNum < $scope.workshopStepsDuration.length){
            initializeIterationTimer($scope.workshopStepsDuration[$scope.roundNum]);
            $scope.currentStep = $scope.workshop.steps[$scope.roundNum];
            if($scope.workshop.steps[$scope.roundNum+1] != undefined)
                $scope.nextStep = $scope.workshop.steps[$scope.roundNum+1];
            else
                $scope.nextStep = "";
            $scope.iterationRunning = false;
            putNextStepMaxHeight();
        } else {
            endOfWorkshop();
        }
    }

    function runGlobalTimer() {
        globalTimerInterval = $interval(function(){
            if($scope.isLate){
                $scope.globalTimer++;
            } else {
                $scope.globalTimer--;
                if($scope.globalTimer == -1) {
                    $scope.isLate = true;
                    $scope.globalTimer = 1;
                }
            }


        }, 1000);
    }

    function stopGlobalTimer() {
        if (angular.isDefined(globalTimerInterval)) {
            $interval.cancel(globalTimerInterval);
            globalTimerInterval = undefined;
        }
    }

    // This function helps to display the time in a correct way in the center of the timer
    $scope.humanizeDurationTimer = function(input, units) {
        return TimerService.humanizeDurationTimer(input, units);
    };


    //Calc the height of the next step dynamically
    function putNextStepMaxHeight() {

        //TODO Manage to do it without this
        var delay=500; //0.5sec
        setTimeout(function() {
            var hauteurIteration = document.getElementById("actual-iteration").offsetHeight;
            console.log(hauteurIteration);

            var hauteurTotale = document.getElementById("first-row").offsetHeight;
            console.log(hauteurTotale);

            var heightNextIteration = hauteurTotale - hauteurIteration;
            heightNextIteration = heightNextIteration - 13; //TODO find this 13px

            document.getElementById("first-row-in").style.height = heightNextIteration + "px";
        }, delay);

    }
    putNextStepMaxHeight();

});